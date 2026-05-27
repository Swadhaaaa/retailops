from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import duckdb
import uuid
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)

# CREATE TICKET
@tickets_bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():

    data = request.get_json()

    current_user = get_jwt_identity()

    conn = duckdb.connect('tickets.db')

    ticket_id = f"TKT-{str(uuid.uuid4())[:8]}"

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
    })


# GET ALL TICKETS
@tickets_bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():

    current_user = get_jwt_identity()

    conn = duckdb.connect('tickets.db')

    tickets = conn.execute("""
        SELECT *
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
            'priority': ticket[4],
            'status': ticket[5]
        })

    return jsonify(result)