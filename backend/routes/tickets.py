from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import duckdb
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import uuid

tickets_bp = Blueprint('tickets', __name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xlsx', 'txt', 'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# GENERATE CUSTOM TICKET ID
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


# CREATE TICKET
@tickets_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():

    try:
        current_user = get_jwt_identity()
        conn = duckdb.connect('tickets.db')
        ticket_id = generate_ticket_id(conn)

        title = request.form.get('title')
        description = request.form.get('description')
        category_id = request.form.get('category_id')
        priority = request.form.get('priority')

        attachment_path = None

        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                attachment_path = unique_filename

        conn.execute("""
            INSERT INTO tickets (
                ticket_id,
                title,
                description,
                category_id,
                priority,
                status,
                raised_by,
                created_at,
                attachment_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ticket_id,
            title,
            description,
            category_id,
            priority,
            'Open',
            current_user,
            datetime.now(),
            attachment_path
        ])

        conn.close()

        return jsonify({
            'message': 'Ticket created successfully',
            'ticket_id': ticket_id
        }), 201

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# GET ALL USER TICKETS
@tickets_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():

    try:

        current_user = get_jwt_identity()

        conn = duckdb.connect('tickets.db')

        tickets = conn.execute("""
            SELECT
                ticket_id,
                title,
                description,
                category_id,
                priority,
                status,
                raised_by,
                assigned_to,
                created_at,
                attachment_path
            FROM tickets
            WHERE raised_by = ?
            ORDER BY created_at DESC
        """, [current_user]).fetchall()

        conn.close()

        result = []

        for ticket in tickets:
            result.append({
                'ticket_id': ticket[0],
                'title': ticket[1],
                'description': ticket[2],
                'category_id': ticket[3],
                'priority': ticket[4],
                'status': ticket[5],
                'raised_by': ticket[6],
                'assigned_to': ticket[7],
                'created_at': str(ticket[8]),
                'attachment_path': ticket[9]
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# GET SINGLE TICKET
@tickets_bp.route('/<ticket_id>', methods=['GET'])
@jwt_required()
def get_single_ticket(ticket_id):

    try:

        conn = duckdb.connect('tickets.db')

        ticket = conn.execute("""
            SELECT
                ticket_id,
                title,
                description,
                category_id,
                priority,
                status,
                raised_by,
                assigned_to,
                created_at,
                attachment_path
            FROM tickets
            WHERE ticket_id = ?
        """, [ticket_id]).fetchone()

        conn.close()

        if not ticket:
            return jsonify({
                'error': 'Ticket not found'
            }), 404

        return jsonify({
            'ticket_id': ticket[0],
            'title': ticket[1],
            'description': ticket[2],
            'category_id': ticket[3],
            'priority': ticket[4],
            'status': ticket[5],
            'raised_by': ticket[6],
            'assigned_to': ticket[7],
            'created_at': str(ticket[8]),
            'attachment_path': ticket[9]
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ADMIN GET ALL TICKETS
@tickets_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_get_all_tickets():

    try:

        conn = duckdb.connect('tickets.db')

        tickets = conn.execute("""
            SELECT
                ticket_id,
                title,
                description,
                category_id,
                priority,
                status,
                raised_by,
                assigned_to,
                created_at,
                attachment_path
            FROM tickets
            ORDER BY created_at DESC
        """).fetchall()

        conn.close()

        result = []

        for ticket in tickets:
            result.append({
                'ticket_id': ticket[0],
                'title': ticket[1],
                'description': ticket[2],
                'category_id': ticket[3],
                'priority': ticket[4],
                'status': ticket[5],
                'raised_by': ticket[6],
                'assigned_to': ticket[7],
                'created_at': str(ticket[8]),
                'attachment_path': ticket[9]
            })

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# ASSIGN AGENT
@tickets_bp.route('/<ticket_id>/assign', methods=['PUT'])
@jwt_required()
def assign_agent(ticket_id):

    try:

        data = request.get_json()

        agent = data.get('agent')

        conn = duckdb.connect('tickets.db')

        conn.execute("""
            UPDATE tickets
            SET assigned_to = ?,
                status = 'In Progress'
            WHERE ticket_id = ?
        """, [agent, ticket_id])

        conn.close()

        return jsonify({
            'message': 'Agent assigned successfully'
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


# DOWNLOAD ATTACHMENT
@tickets_bp.route('/download/<filename>', methods=['GET'])
@jwt_required()
def download_attachment(filename):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500