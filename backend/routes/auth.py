from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from flask_bcrypt import Bcrypt
import duckdb
from database import get_db

bcrypt = Bcrypt()

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():

    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    conn = get_db()

    # Fetch active user
    user = conn.execute("""
        SELECT *
        FROM users
        WHERE email = ?
        AND is_active = true
    """, [email]).fetchone()

    # User not found
    if not user:
        conn.close()

        return jsonify({
            'error': 'Invalid credentials'
        }), 401

    stored_password = user[3]

    # Password check
    if not bcrypt.check_password_hash(
        stored_password,
        password
    ):
        conn.close()

        return jsonify({
            'error': 'Invalid credentials'
        }), 401

    # Update last login timestamp
    conn.execute("""
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE email = ?
    """, [email])

    # Generate JWT token
    token = create_access_token(
        identity=user[0]
    )

    conn.close()

    return jsonify({
        'token': token,
        'user': {
            'user_id': user[0],
            'name': user[1],
            'email': user[2],
            'role': user[4]
        }
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():

    current_user = get_jwt_identity()

    return jsonify(current_user)