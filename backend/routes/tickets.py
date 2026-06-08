from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import duckdb
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import uuid
from nlp.classifier import suggest_category

tickets_bp = Blueprint('tickets', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xlsx', 'txt', 'csv'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def get_conn():
    return duckdb.connect('tickets.db')


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

def calculate_sla_deadline(priority):
    priority = priority.lower()

    if priority == 'low':
        return datetime.now() + timedelta(hours=72)
    elif priority == 'medium':
        return datetime.now() + timedelta(hours=48)
    elif priority == 'high':
        return datetime.now() + timedelta(hours=24)

    return datetime.now() + timedelta(hours=48)

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
        'attachment_download_url': f'/api/tickets/download/{attachment_path}' if attachment_path else None
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
        'vendor_name': ticket[10] if len(ticket) > 10 else None,
        'category_name': ticket[11] if len(ticket) > 11 else None
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
        sla_deadline = calculate_sla_deadline(priority)
        

        if not title or not description or not category_id_raw:
            conn.close()
            return jsonify({'error': 'Title, description and category are required'}), 400

        try:
            category_id = int(category_id_raw)
        except (TypeError, ValueError):
            conn.close()
            return jsonify({'error': 'Invalid category'}), 400

        category_exists = conn.execute("""
            SELECT 1
            FROM categories
            WHERE category_id = ?
            AND is_active = true
        """, [category_id]).fetchone()

        if not category_exists:
            conn.close()
            return jsonify({'error': 'Invalid category'}), 400

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

        conn.execute("""
           INSERT INTO tickets (
                     ticket_id, title, description, category_id, priority,
                     status, raised_by, created_at, attachment_path, sla_deadline
                     )
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ticket_id,
            title,
            description,
            category_id,
            priority,
            'Open',
            current_user,
            datetime.now(),
            attachment_path,
            sla_deadline
            ])

        conn.close()

        return jsonify({
            'message': 'Ticket created successfully',
            'ticket_id': ticket_id,
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
                   status, raised_by, assigned_to, created_at, attachment_path
            FROM tickets
            WHERE raised_by = ?
            ORDER BY created_at DESC
        """, [current_user]).fetchall()

        conn.close()

        return jsonify([ticket_to_dict(ticket) for ticket in tickets])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# GET SINGLE TICKET WITH MESSAGES
@tickets_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_single_ticket(ticket_id):
    try:
        conn = get_conn()

        ticket = conn.execute("""
            SELECT t.ticket_id, t.title, t.description, t.category_id, t.priority,
                   t.status, t.raised_by, t.assigned_to, t.created_at, t.attachment_path,
                   u.name AS vendor_name, c.name AS category_name
            FROM tickets t
            LEFT JOIN users u ON t.raised_by = u.user_id OR t.raised_by = u.email
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE t.ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        messages = conn.execute("""
            SELECT message_id, ticket_id, sender_id, sender_role,
                   message_text, is_ping, created_at, attachment_path
            FROM messages
            WHERE ticket_id = ?
            ORDER BY created_at ASC
        """, [ticket_id]).fetchall()

        conn.close()

        ticket_data = admin_ticket_to_dict(ticket)

        ticket_data['messages'] = [
            {
                'message_id': msg[0],
                'ticket_id': msg[1],
                'sender_id': msg[2],
                'sender_role': msg[3],
                'message_text': msg[4],
                'is_ping': msg[5],
                'created_at': str(msg[6]),
                'attachment_path': msg[7],
                'has_attachment': bool(msg[7]),
                'attachment_download_url': f'/api/tickets/download/{msg[7]}' if msg[7] else None
            }
            for msg in messages
        ]

        return jsonify(ticket_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADMIN GET ALL TICKETS
@tickets_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_get_all_tickets():
    try:
        conn = get_conn()

        tickets = conn.execute("""
            SELECT t.ticket_id, t.title, t.description, t.category_id, t.priority,
                   t.status, t.raised_by, t.assigned_to, t.created_at, t.attachment_path,
                   u.name AS vendor_name, c.name AS category_name
            FROM tickets t
            LEFT JOIN users u ON t.raised_by = u.user_id OR t.raised_by = u.email
            LEFT JOIN categories c ON t.category_id = c.category_id
            ORDER BY t.created_at DESC
        """).fetchall()

        conn.close()

        return jsonify([admin_ticket_to_dict(ticket) for ticket in tickets])

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ASSIGN AGENT
@tickets_bp.route('/<ticket_id>/assign', methods=['PUT'])
@jwt_required()
def assign_agent(ticket_id):
    try:
        data = request.get_json()
        agent = data.get('agent')

        if not agent:
            return jsonify({'error': 'Agent is required'}), 400

        conn = get_conn()

        conn.execute("""
            UPDATE tickets
            SET assigned_to = ?,
                status = 'In Progress'
            WHERE ticket_id = ?
        """, [agent, ticket_id])

        conn.close()

        return jsonify({'message': 'Agent assigned successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE TICKET STATUS
@tickets_bp.route('/<ticket_id>/status', methods=['PUT'])
@jwt_required()
def update_ticket_status(ticket_id):
    try:
        data = request.get_json()
        status = data.get('status')

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

        ticket = conn.execute("""
            SELECT raised_by FROM tickets WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        conn.execute("""
            UPDATE tickets
            SET status = ?
            WHERE ticket_id = ?
        """, [status, ticket_id])

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
            f'Your ticket {ticket_id} status has been updated to {status}',
            False,
            datetime.now()
        ])

        conn.close()

        return jsonify({'message': f'Ticket status updated to {status}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# UPDATE TICKET PRIORITY
@tickets_bp.route('/<ticket_id>/priority', methods=['PUT'])
@jwt_required()
def update_ticket_priority(ticket_id):
    try:
        data = request.get_json()
        priority = data.get('priority')

        valid_priorities = ['Low', 'Medium', 'High', 'Critical', 'Urgent']

        if priority not in valid_priorities:
            return jsonify({'error': 'Invalid priority'}), 400

        conn = get_conn()

        ticket = conn.execute("""
            SELECT ticket_id FROM tickets WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        conn.execute("""
            UPDATE tickets
            SET priority = ?
            WHERE ticket_id = ?
        """, [priority, ticket_id])

        conn.close()

        return jsonify({'message': f'Ticket priority updated to {priority}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ADMIN PING USER
@tickets_bp.route('/<ticket_id>/ping', methods=['POST'])
@jwt_required()
def ping_user(ticket_id):
    try:
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
            data = request.get_json() or {}
            message_text = data.get('message_text', '').strip()

        if not message_text and not attachment_path:
            return jsonify({'error': 'Message cannot be empty'}), 400

        conn = get_conn()

        ticket = conn.execute("""
            SELECT raised_by, status
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        if not ticket:
            conn.close()
            return jsonify({'error': 'Ticket not found'}), 404

        msg_id = get_next_id(conn, 'messages', 'message_id')

        sender_role = 'user'
        if current_user != ticket[0]:
            sender_role = 'admin'

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
def get_ticket_stats():
    try:
        current_user = get_jwt_identity()
        conn = get_conn()
        
        # Get user's role
        user = conn.execute("SELECT role FROM users WHERE user_id = ?", [current_user]).fetchone()
        is_admin = user and user[0] == 'admin'
        
        if is_admin:
            # Admin stats: all tickets
            tickets = conn.execute("""
                SELECT status FROM tickets
            """).fetchall()
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
