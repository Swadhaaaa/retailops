from flask import Blueprint, request, jsonify, send_file, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid
from functools import wraps
from nlp.classifier import suggest_category
from database import get_db

tickets_bp = Blueprint('tickets', __name__)

def scope_by_department(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        role = claims.get('role')
        department = claims.get('department')

        g.is_department_scoped = False
        g.department = None
        g.dept_filter = ""
        g.dept_params = []

        if role == 'department':
            g.is_department_scoped = True
            g.department = department
            g.dept_filter = " AND COALESCE(t.assigned_department, t.business_unit) = ? "
            g.dept_params = [department]

        return f(*args, **kwargs)
    return decorated_function

def get_current_role():
    return get_jwt().get('role')


def is_staff_role(role):
    return role in ('super_admin', 'admin', 'department')


def ensure_ticket_access(conn, ticket_id):
    current_user = get_jwt_identity()
    role = get_current_role()

    if role in ('super_admin', 'admin'):
        ticket = conn.execute("""
            SELECT ticket_id
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()
    elif role == 'department':
        department = get_jwt().get('department')
        ticket = conn.execute("""
            SELECT ticket_id
            FROM tickets
            WHERE ticket_id = ?
            AND COALESCE(assigned_department, business_unit) = ?
        """, [ticket_id, department]).fetchone()
    else:
        ticket = conn.execute("""
            SELECT ticket_id
            FROM tickets
            WHERE ticket_id = ?
            AND raised_by = ?
        """, [ticket_id, current_user]).fetchone()

    return bool(ticket)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xlsx', 'txt', 'csv'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def ensure_ticket_department_columns(conn):
    category_columns = [row[1] for row in conn.execute("PRAGMA table_info('categories')").fetchall()]
    columns = [row[1] for row in conn.execute("PRAGMA table_info('tickets')").fetchall()]

    if 'assigned_department' not in category_columns:
        conn.execute("ALTER TABLE categories ADD COLUMN assigned_department VARCHAR")

    if 'business_unit' not in columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN business_unit VARCHAR")

    if 'assigned_department' not in columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN assigned_department VARCHAR")

    workflow_columns = {
        'resolution_summary': 'TEXT',
        'root_cause': 'TEXT',
        'action_taken': 'TEXT',
        'resolution_remarks': 'TEXT',
        'resolution_submitted_by': 'VARCHAR',
        'resolution_submitted_at': 'TIMESTAMP',
        'claimed_by': 'VARCHAR',
        'claimed_at': 'TIMESTAMP',
        'resolved_by': 'VARCHAR',
        'reopened_count': 'INTEGER DEFAULT 0',
        'escalation_count': 'INTEGER DEFAULT 0',
        'documents_verified': 'BOOLEAN DEFAULT false',
        'issue_investigated': 'BOOLEAN DEFAULT false',
        'requester_updated': 'BOOLEAN DEFAULT false',
        'final_confirmation_done': 'BOOLEAN DEFAULT false'
    }

    for column, column_type in workflow_columns.items():
        if column not in columns:
            conn.execute(f"ALTER TABLE tickets ADD COLUMN {column} {column_type}")

    conn.execute("""
        UPDATE tickets
        SET assigned_department = COALESCE(assigned_department, business_unit)
        WHERE assigned_department IS NULL
    """)


def get_conn():
    conn = get_db()
    ensure_ticket_department_columns(conn)
    return conn


def ensure_ticket_activity_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ticket_activity (
            activity_id INTEGER PRIMARY KEY,
            ticket_id VARCHAR NOT NULL,
            action_type VARCHAR NOT NULL,
            action_text TEXT NOT NULL,
            actor_id VARCHAR,
            actor_role VARCHAR DEFAULT 'system',
            from_value VARCHAR,
            to_value VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        INSERT INTO ticket_activity (
            activity_id, ticket_id, action_type, action_text,
            actor_id, actor_role, from_value, to_value, created_at
        )
        SELECT
            ROW_NUMBER() OVER (ORDER BY t.created_at, t.ticket_id)
              + COALESCE((SELECT MAX(activity_id) FROM ticket_activity), 0),
            t.ticket_id,
            'created',
            'Ticket created',
            t.raised_by,
            'user',
            NULL,
            t.status,
            t.created_at
        FROM tickets t
        WHERE NOT EXISTS (
            SELECT 1
            FROM ticket_activity a
            WHERE a.ticket_id = t.ticket_id
              AND a.action_type = 'created'
        )
    """)


def ensure_internal_notes_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ticket_internal_notes (
            note_id INTEGER PRIMARY KEY,
            ticket_id VARCHAR NOT NULL,
            note_text TEXT NOT NULL,
            created_by VARCHAR,
            created_by_name VARCHAR,
            created_by_role VARCHAR DEFAULT 'department',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    columns = [row[1] for row in conn.execute("PRAGMA table_info('ticket_internal_notes')").fetchall()]
    if 'created_by_name' not in columns:
        conn.execute("ALTER TABLE ticket_internal_notes ADD COLUMN created_by_name VARCHAR")


def ensure_ticket_escalations_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ticket_escalations (
            escalation_id INTEGER PRIMARY KEY,
            ticket_id VARCHAR NOT NULL,
            from_department VARCHAR,
            to_department VARCHAR NOT NULL,
            reason TEXT NOT NULL,
            escalated_by VARCHAR,
            escalated_by_name VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def get_actor_role(conn, actor_id):
    if not actor_id:
        return 'system'

    user = conn.execute("""
        SELECT role FROM users
        WHERE user_id = ? OR email = ?
        LIMIT 1
    """, [actor_id, actor_id]).fetchone()

    return user[0] if user and user[0] else 'admin'


def get_actor_name(conn, actor_id):
    if not actor_id:
        return 'System'

    user = conn.execute("""
        SELECT name, email
        FROM users
        WHERE user_id = ? OR email = ?
        LIMIT 1
    """, [actor_id, actor_id]).fetchone()

    if user:
        return user[0] or user[1] or actor_id

    return actor_id


def record_ticket_activity(
    conn,
    ticket_id,
    action_type,
    action_text,
    actor_id=None,
    actor_role=None,
    from_value=None,
    to_value=None,
    created_at=None
):
    ensure_ticket_activity_table(conn)
    activity_id = get_next_id(conn, 'ticket_activity', 'activity_id')
    timestamp = created_at or datetime.now()
    role = actor_role or get_actor_role(conn, actor_id)

    conn.execute("""
        INSERT INTO ticket_activity (
            activity_id, ticket_id, action_type, action_text,
            actor_id, actor_role, from_value, to_value, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        activity_id,
        ticket_id,
        action_type,
        action_text,
        actor_id,
        role,
        from_value,
        to_value,
        timestamp
    ])


def get_ticket_activity(conn, ticket_id):
    ensure_ticket_activity_table(conn)
    rows = conn.execute("""
        SELECT a.activity_id, a.ticket_id, a.action_type, a.action_text,
               a.actor_id, a.actor_role, a.from_value, a.to_value, a.created_at,
               COALESCE(u.name, a.actor_id, 'System') AS actor_name
        FROM ticket_activity a
        LEFT JOIN users u ON a.actor_id = u.user_id OR a.actor_id = u.email
        WHERE ticket_id = ?
        ORDER BY a.created_at DESC, a.activity_id DESC
    """, [ticket_id]).fetchall()

    return [
        {
            'activity_id': row[0],
            'ticket_id': row[1],
            'action_type': row[2],
            'action_text': row[3],
            'actor_id': row[4],
            'actor_role': row[5],
            'from_value': row[6],
            'to_value': row[7],
            'created_at': str(row[8]),
            'actor_name': row[9]
        }
        for row in rows
    ]


def get_internal_notes(conn, ticket_id):
    ensure_internal_notes_table(conn)
    rows = conn.execute("""
        SELECT note_id, ticket_id, note_text, created_by,
               COALESCE(created_by_name, created_by), created_by_role, created_at
        FROM ticket_internal_notes
        WHERE ticket_id = ?
        ORDER BY created_at DESC, note_id DESC
    """, [ticket_id]).fetchall()

    return [
        {
            'note_id': row[0],
            'ticket_id': row[1],
            'note_text': row[2],
            'created_by': row[3],
            'created_by_name': row[4],
            'created_by_role': row[5],
            'created_at': str(row[6])
        }
        for row in rows
    ]


def get_ticket_escalations(conn, ticket_id):
    ensure_ticket_escalations_table(conn)
    rows = conn.execute("""
        SELECT escalation_id, ticket_id, from_department, to_department,
               reason, escalated_by, escalated_by_name, created_at
        FROM ticket_escalations
        WHERE ticket_id = ?
        ORDER BY created_at DESC, escalation_id DESC
    """, [ticket_id]).fetchall()

    return [
        {
            'escalation_id': row[0],
            'ticket_id': row[1],
            'from_department': row[2],
            'to_department': row[3],
            'reason': row[4],
            'escalated_by': row[5],
            'escalated_by_name': row[6],
            'created_at': str(row[7])
        }
        for row in rows
    ]


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_ticket_id(conn):
    last_ticket = conn.execute("""
        SELECT ticket_id
        FROM tickets
        WHERE ticket_id LIKE 'MDM%'
        ORDER BY created_at DESC
        LIMIT 1
    """).fetchone()

    if last_ticket:
        try:
            last_number = int(last_ticket[0].replace("MDM", ""))
            new_number = last_number + 1
        except:
            new_number = 1
    else:
        new_number = 1

    return f"MDM{new_number:06d}"


def get_next_id(conn, table_name, id_column):
    row = conn.execute(
        f"SELECT COALESCE(MAX({id_column}), 0) + 1 FROM {table_name}"
    ).fetchone()
    return row[0]

# AI CATEGORY SUGGESTION
@tickets_bp.route('/nlp/suggest', methods=['POST'])
@jwt_required()
def suggest_ticket_category():
    try:
        data = request.get_json() or {}
        description = data.get("description", "")

        category = suggest_category(description)

        return jsonify({
            "category": category,
            "confidence": 0.9
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def ticket_to_dict(ticket):
    attachment_path = ticket[9]

    return {
        'ticket_id': ticket[0],
        'title': ticket[1],
        'description': ticket[2],
        'category_id': ticket[3],
        'priority': ticket[4],
        'status': ticket[5],
        'raised_by': ticket[6],
        'assigned_to': ticket[7],
        'created_at': str(ticket[8]),
        'attachment_path': attachment_path,
        'has_attachment': bool(attachment_path),
        'attachment_download_url': f'/api/tickets/download/{attachment_path}' if attachment_path else None,
        'updated_at': str(ticket[10]) if len(ticket) > 10 and ticket[10] else None,
        'resolved_at': str(ticket[11]) if len(ticket) > 11 and ticket[11] else None,
        'business_unit': ticket[12] if len(ticket) > 12 else None,
        'assigned_department': ticket[13] if len(ticket) > 13 and ticket[13] else (ticket[12] if len(ticket) > 12 else None),
        'resolution_summary': ticket[14] if len(ticket) > 14 else None,
        'root_cause': ticket[15] if len(ticket) > 15 else None,
        'action_taken': ticket[16] if len(ticket) > 16 else None,
        'resolution_remarks': ticket[17] if len(ticket) > 17 else None,
        'resolution_submitted_by': ticket[18] if len(ticket) > 18 else None,
        'resolution_submitted_at': str(ticket[19]) if len(ticket) > 19 and ticket[19] else None,
        'claimed_by': ticket[20] if len(ticket) > 20 else None,
        'claimed_at': str(ticket[21]) if len(ticket) > 21 and ticket[21] else None,
        'resolved_by': ticket[22] if len(ticket) > 22 else None,
        'reopened_count': ticket[23] if len(ticket) > 23 and ticket[23] else 0,
        'escalation_count': ticket[24] if len(ticket) > 24 and ticket[24] else 0,
        'resolution_checklist': {
            'documents_verified': bool(ticket[25]) if len(ticket) > 25 else False,
            'issue_investigated': bool(ticket[26]) if len(ticket) > 26 else False,
            'requester_updated': bool(ticket[27]) if len(ticket) > 27 else False,
            'final_confirmation_done': bool(ticket[28]) if len(ticket) > 28 else False
        }
    }


def admin_ticket_to_dict(ticket):
    attachment_path = ticket[9]

    return {
        'ticket_id': ticket[0],
        'title': ticket[1],
        'description': ticket[2],
        'category_id': ticket[3],
        'priority': ticket[4],
        'status': ticket[5],
        'raised_by': ticket[6],
        'assigned_to': ticket[7],
        'created_at': str(ticket[8]),
        'attachment_path': attachment_path,
        'has_attachment': bool(attachment_path),
        'attachment_download_url': f'/api/tickets/download/{attachment_path}' if attachment_path else None,
        'updated_at': str(ticket[10]) if len(ticket) > 10 and ticket[10] else None,
        'resolved_at': str(ticket[11]) if len(ticket) > 11 and ticket[11] else None,
        'business_unit': ticket[12] if len(ticket) > 12 else None,
        'assigned_department': ticket[13] if len(ticket) > 13 and ticket[13] else (ticket[12] if len(ticket) > 12 else None),
        'resolution_summary': ticket[14] if len(ticket) > 14 else None,
        'root_cause': ticket[15] if len(ticket) > 15 else None,
        'action_taken': ticket[16] if len(ticket) > 16 else None,
        'resolution_remarks': ticket[17] if len(ticket) > 17 else None,
        'resolution_submitted_by': ticket[18] if len(ticket) > 18 else None,
        'resolution_submitted_at': str(ticket[19]) if len(ticket) > 19 and ticket[19] else None,
        'vendor_name': ticket[20] if len(ticket) > 20 else None,
        'category_name': ticket[21] if len(ticket) > 21 else None,
        'claimed_by': ticket[22] if len(ticket) > 22 else None,
        'claimed_at': str(ticket[23]) if len(ticket) > 23 and ticket[23] else None,
        'resolved_by': ticket[24] if len(ticket) > 24 else None,
        'reopened_count': ticket[25] if len(ticket) > 25 and ticket[25] else 0,
        'escalation_count': ticket[26] if len(ticket) > 26 and ticket[26] else 0,
        'resolution_checklist': {
            'documents_verified': bool(ticket[27]) if len(ticket) > 27 else False,
            'issue_investigated': bool(ticket[28]) if len(ticket) > 28 else False,
            'requester_updated': bool(ticket[29]) if len(ticket) > 29 else False,
            'final_confirmation_done': bool(ticket[30]) if len(ticket) > 30 else False
        },
        'has_user_clarification': bool(ticket[31]) if len(ticket) > 31 else False
    }


# CREATE TICKET WITH OPTIONAL ATTACHMENT
@tickets_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    try:
        current_user = get_jwt_identity()
        conn = get_conn()

        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id_raw = request.form.get('category_id')
        priority = request.form.get('priority') or 'Medium'
        if not title or not description or not category_id_raw:
            conn.close()
            return jsonify({'error': 'Title, description and category are required'}), 400

        try:
            category_id = int(category_id_raw)
        except (TypeError, ValueError):
            conn.close()
            return jsonify({'error': 'Invalid category'}), 400

        category = conn.execute("""
            SELECT name, assigned_department
            FROM categories
            WHERE category_id = ?
            AND is_active = true
        """, [category_id]).fetchone()

        if not category:
            conn.close()
            return jsonify({'error': 'Invalid category'}), 400

        assigned_department = category[1] or 'Operations'

        ticket_id = generate_ticket_id(conn)
        attachment_path = None

        if 'attachment' in request.files:
            file = request.files['attachment']

            if file and file.filename:
                if not allowed_file(file.filename):
                    conn.close()
                    return jsonify({'error': 'File type not allowed'}), 400

                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)

                if file_size > MAX_FILE_SIZE:
                    conn.close()
                    return jsonify({'error': 'File size must be under 10 MB'}), 400

                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

                file.save(file_path)
                attachment_path = unique_filename

        created_at = datetime.now()

        conn.execute("""
           INSERT INTO tickets (
                     ticket_id, title, description, category_id, priority,
                     status, raised_by, assigned_to, created_at, attachment_path,
                     business_unit, assigned_department
                     )
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ticket_id,
            title,
            description,
            category_id,
            priority,
            'Open',
            current_user,
            assigned_department,
            created_at,
            attachment_path,
            assigned_department,
            assigned_department
            ])

        record_ticket_activity(
            conn,
            ticket_id,
            'department_assigned',
            f'Ticket assigned to {assigned_department} department',
            'system',
            'system',
            None,
            assigned_department,
            created_at
        )

        record_ticket_activity(
            conn,
            ticket_id,
            'created',
            f'Ticket created by {current_user}',
            current_user,
            'user',
            None,
            'Open',
            created_at
        )

        conn.close()

        return jsonify({
            'message': 'Ticket created successfully',
            'ticket_id': ticket_id,
            'assigned_department': assigned_department,
            'attachment_path': attachment_path,
            'has_attachment': bool(attachment_path)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET USER TICKETS
@tickets_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    try:
        current_user = get_jwt_identity()
        conn = get_conn()

        tickets = conn.execute("""
            SELECT ticket_id, title, description, category_id, priority,
                   status, raised_by, assigned_to, created_at, attachment_path,
                   updated_at, resolved_at, business_unit,
                   COALESCE(assigned_department, business_unit) AS assigned_department,
                   resolution_summary, root_cause, action_taken, resolution_remarks,
                   resolution_submitted_by, resolution_submitted_at,
                   claimed_by, claimed_at, resolved_by, reopened_count,
                   escalation_count, documents_verified,
                   issue_investigated, requester_updated, final_confirmation_done
            FROM tickets
            WHERE raised_by = ?
            ORDER BY created_at DESC
        """, [current_user]).fetchall()

        conn.close()

        return jsonify([ticket_to_dict(ticket) for ticket in tickets])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/user-edit', methods=['PUT'])
@jwt_required()
def edit_user_ticket(ticket_id):
    try:
        current_user = get_jwt_identity()
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id_raw = request.form.get('category_id')

        if not title or not description or not category_id_raw:
            return jsonify({'error': 'Title, description and category are required'}), 400

        try:
            category_id = int(category_id_raw)
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid category'}), 400

        conn = get_conn()
        ticket = conn.execute("""
            SELECT raised_by, status, title, attachment_path
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        if ticket[0] != current_user:
            conn.close()
            return jsonify({'error': 'You can edit only your own ticket'}), 403

        if ticket[1] != 'Open':
            conn.close()
            return jsonify({'error': 'Ticket can be edited only while it is open'}), 400

        category = conn.execute("""
            SELECT assigned_department
            FROM categories
            WHERE category_id = ?
              AND is_active = true
        """, [category_id]).fetchone()

        if not category:
            conn.close()
            return jsonify({'error': 'Invalid category'}), 400

        assigned_department = category[0] or 'Operations'
        attachment_path = ticket[3]

        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and file.filename:
                if not allowed_file(file.filename):
                    conn.close()
                    return jsonify({'error': 'File type not allowed'}), 400

                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)

                if file_size > MAX_FILE_SIZE:
                    conn.close()
                    return jsonify({'error': 'File size must be under 10 MB'}), 400

                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                attachment_path = unique_filename

        now = datetime.now()
        conn.execute("""
            UPDATE tickets
            SET title = ?,
                description = ?,
                category_id = ?,
                business_unit = ?,
                assigned_department = ?,
                assigned_to = ?,
                attachment_path = ?,
                updated_at = ?
            WHERE ticket_id = ?
        """, [
            title, description, category_id, assigned_department,
            assigned_department, assigned_department, attachment_path, now, ticket_id
        ])

        record_ticket_activity(
            conn, ticket_id, 'user_edited', 'Ticket details edited by user',
            current_user, 'user', ticket[2], title, now
        )

        conn.close()
        return jsonify({'message': 'Ticket updated successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_user_ticket(ticket_id):
    try:
        current_user = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        reason = (data.get('reason') or '').strip()

        conn = get_conn()
        ticket = conn.execute("""
            SELECT raised_by, status
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        if ticket[0] != current_user:
            conn.close()
            return jsonify({'error': 'You can withdraw only your own ticket'}), 403

        if ticket[1] != 'Open':
            conn.close()
            return jsonify({'error': 'Ticket can be withdrawn only while it is open'}), 400

        now = datetime.now()
        conn.execute("""
            UPDATE tickets
            SET status = 'Withdrawn',
                updated_at = ?
            WHERE ticket_id = ?
        """, [now, ticket_id])

        record_ticket_activity(
            conn, ticket_id, 'user_withdrawn',
            f"Ticket withdrawn by user{f': {reason}' if reason else ''}",
            current_user, 'user', ticket[1], 'Withdrawn', now
        )

        conn.close()
        return jsonify({'message': 'Ticket withdrawn successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/clarification', methods=['POST'])
@jwt_required()
def submit_user_clarification(ticket_id):
    try:
        current_user = get_jwt_identity()
        clarification = request.form.get('clarification', '').strip()

        if not clarification:
            return jsonify({'error': 'Clarification details are required'}), 400

        conn = get_conn()
        ticket = conn.execute("""
            SELECT raised_by, status, attachment_path
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        if ticket[0] != current_user:
            conn.close()
            return jsonify({'error': 'You can clarify only your own ticket'}), 403

        if ticket[1] != 'Needs Clarification':
            conn.close()
            return jsonify({'error': 'Clarification is allowed only when requested'}), 400

        attachment_path = ticket[2]
        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and file.filename:
                if not allowed_file(file.filename):
                    conn.close()
                    return jsonify({'error': 'File type not allowed'}), 400

                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)

                if file_size > MAX_FILE_SIZE:
                    conn.close()
                    return jsonify({'error': 'File size must be under 10 MB'}), 400

                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                attachment_path = unique_filename

        now = datetime.now()
        conn.execute("""
            UPDATE tickets
            SET description = description || '\n\nUser clarification: ' || ?,
                attachment_path = ?,
                status = 'In Progress',
                updated_at = ?
            WHERE ticket_id = ?
        """, [clarification, attachment_path, now, ticket_id])

        record_ticket_activity(
            conn, ticket_id, 'user_clarification',
            f'User submitted clarification: {clarification}',
            current_user, 'user', 'Needs Clarification', 'In Progress', now
        )

        conn.close()
        return jsonify({'message': 'Clarification submitted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET SINGLE TICKET WITH MESSAGES
@tickets_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
@scope_by_department
def get_single_ticket(ticket_id):
    try:
        conn = get_conn()
        role = get_current_role()

        if not is_staff_role(role) and not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        query = f"""
            SELECT t.ticket_id, t.title, t.description, t.category_id, t.priority,
                   t.status, t.raised_by, t.assigned_to, t.created_at, t.attachment_path,
                   t.updated_at, t.resolved_at, t.business_unit,
                   COALESCE(t.assigned_department, t.business_unit) AS assigned_department,
                   t.resolution_summary, t.root_cause, t.action_taken, t.resolution_remarks,
                   t.resolution_submitted_by, t.resolution_submitted_at,
                   u.name AS vendor_name, c.name AS category_name,
                   t.claimed_by, t.claimed_at, t.resolved_by, t.reopened_count,
                   t.escalation_count, t.documents_verified,
                   t.issue_investigated, t.requester_updated, t.final_confirmation_done,
                   EXISTS (
                       SELECT 1
                       FROM ticket_activity a
                       WHERE a.ticket_id = t.ticket_id
                         AND a.action_type = 'user_clarification'
                   ) AS has_user_clarification
            FROM tickets t
            LEFT JOIN users u ON t.raised_by = u.user_id OR t.raised_by = u.email
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE t.ticket_id = ? {g.dept_filter}
        """

        ticket = conn.execute(query, [ticket_id] + g.dept_params).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket_data = admin_ticket_to_dict(ticket)
        ticket_data['activity'] = get_ticket_activity(conn, ticket_id)
        if is_staff_role(role):
            ticket_data['internal_notes'] = get_internal_notes(conn, ticket_id)
            ticket_data['escalations'] = get_ticket_escalations(conn, ticket_id)

        conn.close()

        # TEMPORARILY DISABLED - MESSAGES FEATURE
        ticket_data['messages'] = []
        return jsonify(ticket_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/activity', methods=['GET'])
@jwt_required()
def get_ticket_activity_history(ticket_id):
    try:
        conn = get_conn()

        if not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        activity = get_ticket_activity(conn, ticket_id)
        conn.close()

        return jsonify(activity)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADMIN GET ALL TICKETS
@tickets_bp.route('/admin/all', methods=['GET'])
@jwt_required()
@scope_by_department
def admin_get_all_tickets():
    try:
        conn = get_conn()
        role = get_current_role()

        if not is_staff_role(role):
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403

        query = f"""
            SELECT t.ticket_id, t.title, t.description, t.category_id, t.priority,
                   t.status, t.raised_by, t.assigned_to, t.created_at, t.attachment_path,
                   t.updated_at, t.resolved_at, t.business_unit,
                   COALESCE(t.assigned_department, t.business_unit) AS assigned_department,
                   t.resolution_summary, t.root_cause, t.action_taken, t.resolution_remarks,
                   t.resolution_submitted_by, t.resolution_submitted_at,
                   u.name AS vendor_name, c.name AS category_name,
                   t.claimed_by, t.claimed_at, t.resolved_by, t.reopened_count,
                   t.escalation_count, t.documents_verified,
                   t.issue_investigated, t.requester_updated, t.final_confirmation_done
            FROM tickets t
            LEFT JOIN users u ON t.raised_by = u.user_id OR t.raised_by = u.email
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE 1=1 {g.dept_filter}
            ORDER BY t.created_at DESC
        """

        tickets = conn.execute(query, g.dept_params).fetchall()

        conn.close()

        return jsonify([admin_ticket_to_dict(ticket) for ticket in tickets])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ASSIGN AGENT
@tickets_bp.route('/<ticket_id>/assign', methods=['PUT'])
@jwt_required()
@scope_by_department
def assign_agent(ticket_id):
    try:
        data = request.get_json()
        agent = data.get('agent')

        if not agent:
            return jsonify({'error': 'Agent is required'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT assigned_to, status
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        previous_agent = ticket[0]
        previous_status = ticket[1]
        now = datetime.now()
        role = get_current_role()
        if role == 'department' and g.department:
            agent_user = conn.execute("""
            SELECT user_id, name
            FROM users
            WHERE role = 'department'
              AND department = ?
              AND (name = ? OR email = ? OR user_id = ?)
            LIMIT 1
        """, [g.department, agent, agent, agent]).fetchone()
        else:
            agent_user = conn.execute("""
            SELECT user_id
            FROM users
            WHERE role = 'department'
              AND (name = ? OR email = ? OR user_id = ?)
            LIMIT 1
        """, [agent, agent, agent]).fetchone()

        if role == 'department' and not agent_user:
            conn.close()
            return jsonify({'error': 'Agent must be a user in your department'}), 400

        claimed_by = agent_user[0] if agent_user else None

        conn.execute("""
            UPDATE tickets
            SET assigned_to = ?,
                claimed_by = ?,
                claimed_at = ?,
                status = 'In Progress',
                updated_at = ?
            WHERE ticket_id = ?
        """, [agent, claimed_by, now if claimed_by else None, now, ticket_id])

        current_user = get_jwt_identity()

        if previous_agent != agent:
            record_ticket_activity(
                conn,
                ticket_id,
                'assigned',
                f'Ticket assigned to {agent}',
                current_user,
                None,
                previous_agent or 'Unassigned',
                agent,
                now
            )

        if previous_status != 'In Progress':
            record_ticket_activity(
                conn,
                ticket_id,
                'status_changed',
                'Status changed to In Progress',
                current_user,
                None,
                previous_status,
                'In Progress',
                now
            )

        conn.close()

        return jsonify({'message': 'Agent assigned successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE TICKET STATUS
@tickets_bp.route('/<ticket_id>/status', methods=['PUT'])
@jwt_required()
@scope_by_department
def update_ticket_status(ticket_id):
    try:
        data = request.get_json()
        status = data.get('status')
        clarification_note = (data.get('clarification_note') or '').strip()

        valid_statuses = [
            'Open',
            'Under Review',
            'In Progress',
            'Needs Clarification',
            'Resolved',
            'Closed'
        ]

        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT raised_by, status FROM tickets WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        if status == 'Resolved':
            conn.close()
            return jsonify({'error': 'Use the resolution form to mark a ticket as resolved'}), 400

        if status == 'Closed' and ticket[1] != 'Resolved':
            conn.close()
            return jsonify({'error': 'Only resolved tickets can be closed'}), 400

        now = datetime.now()
        resolved_at = now if status in ['Resolved', 'Closed'] else None
        previous_status = ticket[1]

        conn.execute("""
            UPDATE tickets
            SET status = ?,
                updated_at = ?,
                resolved_at = ?
            WHERE ticket_id = ?
        """, [status, now, resolved_at, ticket_id])

        current_user = get_jwt_identity()

        if previous_status != status:
            record_ticket_activity(
                conn,
                ticket_id,
                'status_changed',
                f'Status changed to {status}',
                current_user,
                None,
                previous_status,
                status,
                now
            )

            if status == 'Closed':
                record_ticket_activity(
                    conn,
                    ticket_id,
                    'ticket_closed',
                    'Ticket closed',
                    current_user,
                    None,
                    previous_status,
                    'Closed',
                    now
                )

        if status == 'Needs Clarification' and clarification_note:
            record_ticket_activity(
                conn,
                ticket_id,
                'clarification_requested',
                f'Clarification requested: {clarification_note}',
                current_user,
                None,
                None,
                'Needs Clarification',
                now
            )

        # TEMPORARILY DISABLED - MESSAGES FEATURE
        # Notification records are part of the disabled Messages/Notifications surface.
        # notif_id = get_next_id(conn, 'notifications', 'notif_id')
        #
        # conn.execute("""
        #     INSERT INTO notifications (
        #         notif_id, user_id, ticket_id, message, is_read, created_at
        #     )
        #     VALUES (?, ?, ?, ?, ?, ?)
        # """, [
        #     notif_id,
        #     ticket[0],
        #     ticket_id,
        #     f'Your ticket {ticket_id} status has been updated to {status}',
        #     False,
        #     datetime.now()
        # ])

        conn.close()

        return jsonify({'message': f'Ticket status updated to {status}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/department/assigned', methods=['GET'])
@jwt_required()
@scope_by_department
def get_department_assigned_tickets():
    try:
        if get_current_role() != 'department' or not g.department:
            return jsonify({'error': 'Department access required'}), 403

        conn = get_conn()
        ensure_ticket_activity_table(conn)
        tickets = conn.execute(f"""
            SELECT t.ticket_id, t.title, t.description, t.category_id, t.priority,
                   t.status, t.raised_by, t.assigned_to, t.created_at, t.attachment_path,
                   t.updated_at, t.resolved_at, t.business_unit,
                   COALESCE(t.assigned_department, t.business_unit) AS assigned_department,
                   t.resolution_summary, t.root_cause, t.action_taken, t.resolution_remarks,
                   t.resolution_submitted_by, t.resolution_submitted_at,
                   u.name AS vendor_name, c.name AS category_name,
                   t.claimed_by, t.claimed_at, t.resolved_by, t.reopened_count,
                   t.escalation_count, t.documents_verified,
                   t.issue_investigated, t.requester_updated, t.final_confirmation_done
            FROM tickets t
            LEFT JOIN users u ON t.raised_by = u.user_id OR t.raised_by = u.email
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE 1=1 {g.dept_filter}
            ORDER BY t.created_at DESC
        """, g.dept_params).fetchall()
        conn.close()
        return jsonify([admin_ticket_to_dict(ticket) for ticket in tickets])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_ticket_departments():
    try:
        if not is_staff_role(get_current_role()):
            return jsonify({'error': 'Forbidden'}), 403

        conn = get_conn()
        rows = conn.execute("""
            SELECT DISTINCT assigned_department
            FROM categories
            WHERE assigned_department IS NOT NULL
              AND assigned_department != ''
            ORDER BY assigned_department ASC
        """).fetchall()
        conn.close()

        departments = [row[0] for row in rows]
        if 'Operations' not in departments:
            departments.append('Operations')

        return jsonify(departments)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/claim', methods=['POST'])
@jwt_required()
@scope_by_department
def claim_ticket(ticket_id):
    try:
        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT assigned_to, status, COALESCE(assigned_department, business_unit), claimed_by
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        current_user = get_jwt_identity()
        owner_name = get_actor_name(conn, current_user)
        previous_owner = ticket[0]
        assigned_department = ticket[2]
        available_owner_values = [None, '', 'Unassigned', assigned_department]

        if ticket[3] and ticket[3] != current_user:
            conn.close()
            return jsonify({'error': f'Ticket is already claimed by {previous_owner}'}), 409

        if previous_owner not in available_owner_values and previous_owner != owner_name:
            conn.close()
            return jsonify({'error': f'Ticket is already assigned to {previous_owner}'}), 409

        now = datetime.now()
        new_status = 'In Progress' if ticket[1] == 'Open' else ticket[1]

        conn.execute("""
            UPDATE tickets
            SET assigned_to = ?,
                claimed_by = ?,
                claimed_at = ?,
                status = ?,
                updated_at = ?
            WHERE ticket_id = ?
        """, [owner_name, current_user, now, new_status, now, ticket_id])

        if previous_owner != owner_name:
            record_ticket_activity(
                conn,
                ticket_id,
                'ticket_claimed',
                f'Ticket claimed by {owner_name}',
                current_user,
                None,
                previous_owner or 'Unassigned',
                owner_name,
                now
            )

        if ticket[1] != new_status:
            record_ticket_activity(
                conn,
                ticket_id,
                'status_changed',
                f'Status changed to {new_status}',
                current_user,
                None,
                ticket[1],
                new_status,
                now
            )

        conn.close()

        return jsonify({'message': 'Ticket claimed successfully', 'owner': owner_name})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/release', methods=['POST'])
@jwt_required()
@scope_by_department
def release_ticket(ticket_id):
    try:
        conn = get_conn()
        role = get_current_role()

        if not is_staff_role(role) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT assigned_to, claimed_by, COALESCE(assigned_department, business_unit), status
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        current_user = get_jwt_identity()
        if role == 'department' and ticket[1] and ticket[1] != current_user:
            conn.close()
            return jsonify({'error': 'Only the current owner can release this ticket'}), 403

        if not ticket[1]:
            conn.close()
            return jsonify({'error': 'Ticket is not currently claimed'}), 409

        now = datetime.now()
        released_owner = ticket[0]
        new_status = 'Open' if ticket[3] == 'In Progress' else ticket[3]
        conn.execute("""
            UPDATE tickets
            SET assigned_to = ?, claimed_by = NULL, claimed_at = NULL,
                status = ?, updated_at = ?
            WHERE ticket_id = ?
        """, [ticket[2], new_status, now, ticket_id])

        record_ticket_activity(
            conn, ticket_id, 'ticket_released',
            f'Ticket released by {get_actor_name(conn, current_user)}',
            current_user, role, released_owner, 'Unclaimed', now
        )
        if new_status != ticket[3]:
            record_ticket_activity(
                conn, ticket_id, 'status_changed', 'Status changed to Open',
                current_user, role, ticket[3], 'Open', now
            )

        conn.close()
        return jsonify({'message': 'Ticket released successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/notes', methods=['POST'])
@jwt_required()
@scope_by_department
def add_internal_note(ticket_id):
    try:
        data = request.get_json() or {}
        note_text = (data.get('note_text') or '').strip()

        if not note_text:
            return jsonify({'error': 'Internal note is required'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ensure_internal_notes_table(conn)
        current_user = get_jwt_identity()
        author_name = get_actor_name(conn, current_user)
        now = datetime.now()
        note_id = get_next_id(conn, 'ticket_internal_notes', 'note_id')

        conn.execute("""
            INSERT INTO ticket_internal_notes (
                note_id, ticket_id, note_text, created_by,
                created_by_name, created_by_role, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            note_id,
            ticket_id,
            note_text,
            current_user,
            author_name,
            get_current_role() or 'department',
            now
        ])

        record_ticket_activity(
            conn,
            ticket_id,
            'internal_note_added',
            f'Internal note added by {author_name}',
            current_user,
            None,
            None,
            None,
            now
        )

        conn.close()

        return jsonify({'message': 'Internal note added'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/notes', methods=['GET'])
@jwt_required()
@scope_by_department
def fetch_internal_notes(ticket_id):
    try:
        conn = get_conn()
        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        notes = get_internal_notes(conn, ticket_id)
        conn.close()
        return jsonify(notes)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/reassign-department', methods=['POST'])
@jwt_required()
@scope_by_department
def reassign_department(ticket_id):
    try:
        data = request.get_json() or {}
        target_department = (data.get('target_department') or '').strip()
        reason = (data.get('reason') or '').strip()

        if not target_department or not reason:
            return jsonify({'error': 'Target department and escalation reason are required'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT COALESCE(assigned_department, business_unit)
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        previous_department = ticket[0]
        if target_department == previous_department:
            conn.close()
            return jsonify({'error': 'Target department must be different'}), 400

        valid_department = conn.execute("""
            SELECT 1
            FROM categories
            WHERE assigned_department = ?
            UNION ALL
            SELECT 1
            FROM users
            WHERE role = 'department' AND department = ?
            LIMIT 1
        """, [target_department, target_department]).fetchone()
        if not valid_department:
            conn.close()
            return jsonify({'error': 'Invalid target department'}), 400

        now = datetime.now()
        current_user = get_jwt_identity()
        escalated_by_name = get_actor_name(conn, current_user)

        conn.execute("""
            UPDATE tickets
            SET assigned_department = ?,
                business_unit = ?,
                assigned_to = ?,
                claimed_by = NULL,
                claimed_at = NULL,
                escalation_count = COALESCE(escalation_count, 0) + 1,
                status = 'Open',
                updated_at = ?
            WHERE ticket_id = ?
        """, [target_department, target_department, target_department, now, ticket_id])

        ensure_ticket_escalations_table(conn)
        escalation_id = get_next_id(conn, 'ticket_escalations', 'escalation_id')
        conn.execute("""
            INSERT INTO ticket_escalations (
                escalation_id, ticket_id, from_department, to_department,
                reason, escalated_by, escalated_by_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            escalation_id, ticket_id, previous_department, target_department,
            reason, current_user, escalated_by_name, now
        ])

        record_ticket_activity(
            conn,
            ticket_id,
            'department_reassigned',
            f'Ticket transferred from {previous_department} to {target_department}. Reason: {reason}',
            current_user,
            None,
            previous_department,
            target_department,
            now
        )

        conn.close()

        return jsonify({'message': 'Ticket reassigned to department'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/resolve', methods=['POST'])
@jwt_required()
@scope_by_department
def submit_resolution(ticket_id):
    try:
        data = request.get_json() or {}
        resolution_summary = (data.get('resolution_summary') or '').strip()
        root_cause = (data.get('root_cause') or '').strip()
        action_taken = (data.get('action_taken') or '').strip()
        resolution_remarks = (data.get('resolution_remarks') or '').strip()
        checklist = data.get('checklist') or {}
        checklist_fields = [
            'documents_verified',
            'issue_investigated',
            'requester_updated',
            'final_confirmation_done'
        ]

        if not resolution_summary or not root_cause or not action_taken:
            return jsonify({'error': 'Resolution summary, root cause, and action taken are required'}), 400

        if not all(checklist.get(field) is True for field in checklist_fields):
            return jsonify({'error': 'Complete every resolution checklist item'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT status, assigned_to, claimed_by, COALESCE(assigned_department, business_unit)
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        current_user = get_jwt_identity()
        now = datetime.now()

        conn.execute("""
            UPDATE tickets
            SET status = 'Resolved',
                updated_at = ?,
                resolved_at = ?,
                resolution_summary = ?,
                root_cause = ?,
                action_taken = ?,
                resolution_remarks = ?,
                resolution_submitted_by = ?,
                resolution_submitted_at = ?,
                resolved_by = ?,
                documents_verified = ?,
                issue_investigated = ?,
                requester_updated = ?,
                final_confirmation_done = ?,
                assigned_to = ?,
                claimed_by = NULL,
                claimed_at = NULL
            WHERE ticket_id = ?
        """, [
            now,
            now,
            resolution_summary,
            root_cause,
            action_taken,
            resolution_remarks,
            current_user,
            now,
            current_user,
            checklist['documents_verified'],
            checklist['issue_investigated'],
            checklist['requester_updated'],
            checklist['final_confirmation_done'],
            ticket[3],
            ticket_id
        ])

        record_ticket_activity(
            conn,
            ticket_id,
            'resolution_submitted',
            'Resolution submitted',
            current_user,
            None,
            ticket[0],
            'Resolved',
            now
        )

        if ticket[0] != 'Resolved':
            record_ticket_activity(
                conn,
                ticket_id,
                'status_changed',
                'Status changed to Resolved',
                current_user,
                None,
                ticket[0],
                'Resolved',
                now
            )

        if ticket[2]:
            record_ticket_activity(
                conn,
                ticket_id,
                'ticket_released',
                f'Ticket released after resolution by {get_actor_name(conn, current_user)}',
                current_user,
                get_current_role(),
                ticket[1],
                'Unclaimed',
                now
            )

        conn.close()

        return jsonify({'message': 'Resolution submitted'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tickets_bp.route('/<ticket_id>/reopen', methods=['POST'])
@jwt_required()
@scope_by_department
def reopen_ticket(ticket_id):
    try:
        data = request.get_json() or {}
        reason = (data.get('reason') or '').strip()
        if not reason:
            return jsonify({'error': 'Reopen reason is required'}), 400

        conn = get_conn()
        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("SELECT status FROM tickets WHERE ticket_id = ?", [ticket_id]).fetchone()
        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404
        if ticket[0] not in ('Resolved', 'Closed'):
            conn.close()
            return jsonify({'error': 'Only resolved or closed tickets can be reopened'}), 409

        current_user = get_jwt_identity()
        now = datetime.now()
        conn.execute("""
            UPDATE tickets
            SET status = 'In Progress', resolved_at = NULL, resolved_by = NULL,
                reopened_count = COALESCE(reopened_count, 0) + 1, updated_at = ?
            WHERE ticket_id = ?
        """, [now, ticket_id])
        record_ticket_activity(
            conn, ticket_id, 'ticket_reopened', f'Ticket reopened. Reason: {reason}',
            current_user, get_current_role(), ticket[0], 'In Progress', now
        )
        conn.close()
        return jsonify({'message': 'Ticket reopened successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE TICKET PRIORITY
@tickets_bp.route('/<ticket_id>/priority', methods=['PUT'])
@jwt_required()
@scope_by_department
def update_ticket_priority(ticket_id):
    try:
        data = request.get_json()
        priority = data.get('priority')

        valid_priorities = ['Low', 'Medium', 'High', 'Critical', 'Urgent']

        if priority not in valid_priorities:
            return jsonify({'error': 'Invalid priority'}), 400

        conn = get_conn()

        if not is_staff_role(get_current_role()) or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        ticket = conn.execute("""
            SELECT ticket_id, priority FROM tickets WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        now = datetime.now()

        conn.execute("""
            UPDATE tickets
            SET priority = ?,
                updated_at = ?
            WHERE ticket_id = ?
        """, [priority, now, ticket_id])

        if ticket[1] != priority:
            current_user = get_jwt_identity()
            record_ticket_activity(
                conn,
                ticket_id,
                'priority_changed',
                f'Priority changed to {priority}',
                current_user,
                None,
                ticket[1],
                priority,
                now
            )

        conn.close()

        return jsonify({'message': f'Ticket priority updated to {priority}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADMIN PING USER
@tickets_bp.route('/<ticket_id>/ping', methods=['POST'])
@jwt_required()
def ping_user(ticket_id):
    try:
        # TEMPORARILY DISABLED - MESSAGES FEATURE
        return jsonify({'error': 'Messages feature is temporarily disabled'}), 404

        current_user = get_jwt_identity()
        data = request.get_json()
        message = data.get('message', '').strip()

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        conn = get_conn()

        ticket = conn.execute("""
            SELECT raised_by FROM tickets WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        msg_id = get_next_id(conn, 'messages', 'message_id')

        conn.execute("""
            INSERT INTO messages (
                message_id, ticket_id, sender_id, sender_role,
                message_text, is_ping, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            msg_id,
            ticket_id,
            current_user,
            'admin',
            message,
            True,
            datetime.now()
        ])

        conn.execute("""
            UPDATE tickets
            SET status = 'Needs Clarification'
            WHERE ticket_id = ?
        """, [ticket_id])

        notif_id = get_next_id(conn, 'notifications', 'notif_id')

        conn.execute("""
            INSERT INTO notifications (
                notif_id, user_id, ticket_id, message, is_read, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            notif_id,
            ticket[0],
            ticket_id,
            f'Action required on your ticket {ticket_id}: {message}',
            False,
            datetime.now()
        ])

        conn.close()

        return jsonify({'message': 'User pinged successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADD MESSAGE / USER REPLY
@tickets_bp.route('/<ticket_id>/message', methods=['POST'])
@jwt_required()
def add_message(ticket_id):
    # TEMPORARILY DISABLED - MESSAGES FEATURE
    return jsonify({'error': 'Messages feature is temporarily disabled'}), 404

    try:
        current_user = get_jwt_identity()
        
        attachment_path = None
        # Check if form data is sent (multipart/form-data)
        if request.content_type and 'multipart/form-data' in request.content_type:
            message_text = request.form.get('message_text', '').strip()
            if 'attachment' in request.files:
                file = request.files['attachment']
                if file and file.filename:
                    if not allowed_file(file.filename):
                        return jsonify({'error': 'File type not allowed'}), 400
                        
                    file.seek(0, os.SEEK_END)
                    file_size = file.tell()
                    file.seek(0)
                    if file_size > MAX_FILE_SIZE:
                        return jsonify({'error': 'File size must be under 10 MB'}), 400
                        
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4()}_{filename}"
                    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                    file.save(file_path)
                    attachment_path = unique_filename
        else:
            data = request.get_json(silent=True) or {}
            message_text = (
                data.get('message_text') or
                data.get('content') or
                request.form.get('message_text', '')
            ).strip()

        if not message_text and not attachment_path:
            return jsonify({'error': 'Message cannot be empty'}), 400

        conn = get_conn()

        ticket = conn.execute("""
            SELECT raised_by, status
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket or not ensure_ticket_access(conn, ticket_id):
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        msg_id = get_next_id(conn, 'messages', 'message_id')

        sender_role = get_current_role() or 'user'

        conn.execute("""
            INSERT INTO messages (
                message_id, ticket_id, sender_id, sender_role,
                message_text, is_ping, attachment_path, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            msg_id,
            ticket_id,
            current_user,
            sender_role,
            message_text,
            False,
            attachment_path,
            datetime.now()
        ])

        if sender_role == 'user' and ticket[1] == 'Needs Clarification':
            conn.execute("""
                UPDATE tickets
                SET status = 'Under Review'
                WHERE ticket_id = ?
            """, [ticket_id])

        conn.close()

        return jsonify({
            'message': 'Message sent',
            'attachment_path': attachment_path,
            'has_attachment': bool(attachment_path)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET NOTIFICATIONS
@tickets_bp.route('/notifications/all', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        # TEMPORARILY DISABLED - MESSAGES FEATURE
        return jsonify([])

        current_user = get_jwt_identity()
        conn = get_conn()

        notifications = conn.execute("""
            SELECT notif_id, user_id, ticket_id, message, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, [current_user]).fetchall()

        conn.close()

        result = []
        for notif in notifications:
            result.append({
                'notif_id': notif[0],
                'user_id': notif[1],
                'ticket_id': notif[2],
                'message': notif[3],
                'is_read': notif[4],
                'created_at': str(notif[5])
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# MARK NOTIFICATION AS READ
@tickets_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notif_id):
    try:
        # TEMPORARILY DISABLED - MESSAGES FEATURE
        return jsonify({'error': 'Messages feature is temporarily disabled'}), 404

        current_user = get_jwt_identity()
        conn = get_conn()

        conn.execute("""
            UPDATE notifications
            SET is_read = true
            WHERE notif_id = ? AND user_id = ?
        """, [notif_id, current_user])

        conn.close()

        return jsonify({'message': 'Notification marked as read'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# DOWNLOAD ATTACHMENT BY FILENAME
@tickets_bp.route('/download/<filename>', methods=['GET'])
@jwt_required()
def download_attachment(filename):
    try:
        safe_filename = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

        conn = get_conn()
        ticket = conn.execute("""
            SELECT ticket_id
            FROM tickets
            WHERE attachment_path = ?
            LIMIT 1
        """, [safe_filename]).fetchone()

        if not ticket or not ensure_ticket_access(conn, ticket[0]):
            conn.close()
            return jsonify({'error': 'File not found'}), 404

        conn.close()

        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404

        return send_file(file_path, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET ALL ANNOUNCEMENTS
@tickets_bp.route('/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    try:
        conn = get_conn()
        announcements = conn.execute("""
            SELECT announcement_id, title, content, category, effective_date
            FROM announcements
            ORDER BY effective_date DESC
        """).fetchall()
        conn.close()
        
        result = []
        for ann in announcements:
            result.append({
                'announcement_id': ann[0],
                'title': ann[1],
                'content': ann[2],
                'category': ann[3],
                'effective_date': str(ann[4])
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET TICKET AND ANNOUNCEMENT STATS
@tickets_bp.route('/stats', methods=['GET'])
@jwt_required()
@scope_by_department
def get_ticket_stats():
    try:
        current_user = get_jwt_identity()
        conn = get_conn()

        claims = get_jwt()
        role = claims.get('role')

        is_admin_or_dept = role in ('super_admin', 'admin', 'department')

        if is_admin_or_dept:
            query = f"SELECT status FROM tickets t WHERE 1=1 {g.dept_filter}"
            tickets = conn.execute(query, g.dept_params).fetchall()
        else:
            # User stats: only their raised tickets
            tickets = conn.execute("""
                SELECT status FROM tickets WHERE raised_by = ?
            """, [current_user]).fetchall()
            
        announcements_count = conn.execute("SELECT COUNT(*) FROM announcements").fetchone()[0]
        conn.close()
        
        open_cnt = 0
        pending_cnt = 0
        resolved_cnt = 0
        
        for t in tickets:
            status = t[0]
            if status == 'Open':
                open_cnt += 1
            elif status in ['In Progress', 'Under Review', 'Needs Clarification']:
                pending_cnt += 1
            elif status in ['Resolved', 'Closed']:
                resolved_cnt += 1
                
        return jsonify({
            'open': open_cnt,
            'pending': pending_cnt,
            'resolved': resolved_cnt,
            'announcements': announcements_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
