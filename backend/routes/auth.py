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


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():

    data = request.get_json() or {}

    email = (data.get('email') or '').strip().lower()
    new_password = data.get('new_password') or ''

    if not email or not new_password:
        return jsonify({
            'error': 'Email and new password are required'
        }), 400

    if len(new_password) < 6:
        return jsonify({
            'error': 'Password must be at least 6 characters'
        }), 400

    conn = get_db()

    user = conn.execute("""
        SELECT user_id
        FROM users
        WHERE lower(email) = ?
        AND is_active = true
    """, [email]).fetchone()

    if not user:
        conn.close()

        return jsonify({
            'error': 'No active account found for this email'
        }), 404

    password_hash = bcrypt.generate_password_hash(
        new_password
    ).decode('utf-8')

    conn.execute("""
        UPDATE users
        SET password_hash = ?
        WHERE user_id = ?
    """, [password_hash, user[0]])

    conn.close()

    return jsonify({
        'message': 'Password reset successfully'
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():

    current_user = get_jwt_identity()

    return jsonify(current_user)
