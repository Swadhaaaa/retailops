from flask import Blueprint, jsonify, g, request
from flask_jwt_extended import jwt_required, get_jwt
from flask_bcrypt import Bcrypt
from database import get_db
from routes.tickets import scope_by_department

user_bp = Blueprint('user', __name__)
bcrypt = Bcrypt()

def get_conn():
    return get_db()

ROLE_TO_LABEL = {
    'admin': 'Admin',
    'department': 'Department User'
}

LABEL_TO_ROLE = {label: role for role, label in ROLE_TO_LABEL.items()}

def require_admin_role():
    return get_jwt().get('role') == 'admin'

def normalize_role(role):
    return LABEL_TO_ROLE.get(role, role)

def admin_user_to_dict(row):
    return {
        'id': row[0],
        'name': row[1],
        'email': row[2],
        'role': ROLE_TO_LABEL.get(row[3], row[3]),
        'department': row[4],
        'status': 'Active' if row[5] else 'Inactive',
        'createdAt': str(row[6]) if row[6] else None,
        'lastLogin': str(row[7]) if row[7] else None
    }

@user_bp.route('/agents', methods=['GET'])
@jwt_required()
@scope_by_department
def get_agents():
    try:
        role = get_jwt().get('role')
        if role not in ('admin', 'department'):
            return jsonify({'error': 'Forbidden'}), 403

        conn = get_conn()

        # We need to fetch all users where role = 'department'.
        # Since this endpoint is also scope_by_department, if the requester is a department,
        # g.dept_filter will be ' AND t.business_unit = ? '. We adapt it to ' AND department = ? '.
        dept_filter = ""
        dept_params = []
        if g.is_department_scoped:
            dept_filter = " AND department = ? "
            dept_params = [g.department]

        query = f"""
            SELECT name, email, department
            FROM users
            WHERE role = 'department' {dept_filter}
            ORDER BY name ASC
        """

        agents = conn.execute(query, dept_params).fetchall()
        conn.close()

        result = [
            {'name': r[0], 'email': r[1], 'department': r[2]}
            for r in agents
        ]
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/admins', methods=['GET'])
@jwt_required()
def get_admin_users():
    try:
        if not require_admin_role():
            return jsonify({'error': 'Forbidden'}), 403

        conn = get_conn()
        rows = conn.execute("""
            SELECT user_id, name, email, role, department, is_active, created_at, last_login
            FROM users
            WHERE role IN ('admin', 'department')
            ORDER BY created_at ASC, name ASC
        """).fetchall()
        conn.close()

        return jsonify([admin_user_to_dict(row) for row in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/admins', methods=['POST'])
@jwt_required()
def create_admin_user():
    try:
        if not require_admin_role():
            return jsonify({'error': 'Forbidden'}), 403

        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        role = normalize_role(data.get('role') or 'admin')
        department = (data.get('department') or 'Operations').strip()
        is_active = (data.get('status') or 'Active') == 'Active'

        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        if role not in ('admin', 'department'):
            return jsonify({'error': 'Invalid role'}), 400

        conn = get_conn()
        exists = conn.execute("SELECT 1 FROM users WHERE lower(email) = ?", [email]).fetchone()
        if exists:
            conn.close()
            return jsonify({'error': 'Email already exists'}), 409

        next_num = conn.execute("""
            SELECT COALESCE(MAX(CAST(regexp_replace(user_id, '[^0-9]', '', 'g') AS INTEGER)), 10000) + 1
            FROM users
            WHERE user_id LIKE 'ADM-%'
        """).fetchone()[0]
        user_id = f'ADM-{next_num}'
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        conn.execute("""
            INSERT INTO users (
                user_id, name, email, password_hash, role, department,
                assigned_categories, vendor_id, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, '[]', NULL, ?)
        """, [user_id, name, email, password_hash, role, department, is_active])

        row = conn.execute("""
            SELECT user_id, name, email, role, department, is_active, created_at, last_login
            FROM users
            WHERE user_id = ?
        """, [user_id]).fetchone()
        conn.close()

        return jsonify(admin_user_to_dict(row)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/admins/<user_id>', methods=['PUT'])
@jwt_required()
def update_admin_user(user_id):
    try:
        if not require_admin_role():
            return jsonify({'error': 'Forbidden'}), 403

        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        role = normalize_role(data.get('role') or 'admin')
        department = (data.get('department') or '').strip()
        is_active = (data.get('status') or 'Active') == 'Active'

        if not name or not email or not department:
            return jsonify({'error': 'Name, email, and department are required'}), 400
        if role not in ('admin', 'department'):
            return jsonify({'error': 'Invalid role'}), 400

        conn = get_conn()
        existing = conn.execute("SELECT user_id FROM users WHERE user_id = ?", [user_id]).fetchone()
        if not existing:
            conn.close()
            return jsonify({'error': 'User not found'}), 404

        duplicate = conn.execute(
            "SELECT user_id FROM users WHERE lower(email) = ? AND user_id <> ?",
            [email, user_id]
        ).fetchone()
        if duplicate:
            conn.close()
            return jsonify({'error': 'Email already exists'}), 409

        conn.execute("""
            UPDATE users
            SET name = ?, email = ?, role = ?, department = ?, is_active = ?
            WHERE user_id = ?
        """, [name, email, role, department, is_active, user_id])

        row = conn.execute("""
            SELECT user_id, name, email, role, department, is_active, created_at, last_login
            FROM users
            WHERE user_id = ?
        """, [user_id]).fetchone()
        conn.close()

        return jsonify(admin_user_to_dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/admins/<user_id>/status', methods=['PUT'])
@jwt_required()
def update_admin_status(user_id):
    try:
        if not require_admin_role():
            return jsonify({'error': 'Forbidden'}), 403

        data = request.get_json() or {}
        is_active = (data.get('status') or 'Active') == 'Active'
        conn = get_conn()
        conn.execute("UPDATE users SET is_active = ? WHERE user_id = ?", [is_active, user_id])
        row = conn.execute("""
            SELECT user_id, name, email, role, department, is_active, created_at, last_login
            FROM users
            WHERE user_id = ?
        """, [user_id]).fetchone()
        conn.close()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(admin_user_to_dict(row))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/admins/<user_id>', methods=['DELETE'])
@jwt_required()
def deactivate_admin_user(user_id):
    try:
        if not require_admin_role():
            return jsonify({'error': 'Forbidden'}), 403

        conn = get_conn()
        conn.execute("UPDATE users SET is_active = false WHERE user_id = ?", [user_id])
        conn.close()
        return jsonify({'message': 'User deactivated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
