from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import duckdb
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)


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

        data = request.get_json()

        current_user = get_jwt_identity()

        conn = duckdb.connect('tickets.db')

        # Generate Ticket ID
        ticket_id = generate_ticket_id(conn)

        conn.execute("""
            INSERT INTO tickets (
                ticket_id,
                title,
                description,
                category_id,
                priority,
                status,
                raised_by,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ticket_id,
            data.get('title'),
            data.get('description'),
            data.get('category_id'),
            data.get('priority'),
            'Open',
            current_user,
            datetime.now()
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
                created_at
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
                'created_at': str(ticket[8])
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
                created_at
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
            'created_at': str(ticket[8])
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
                created_at
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
                'created_at': str(ticket[8])
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