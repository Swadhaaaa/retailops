from flask import Blueprint, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt
import duckdb
from routes.tickets import scope_by_department

user_bp = Blueprint('user', __name__)

def get_conn():
    return duckdb.connect('tickets.db')

@user_bp.route('/agents', methods=['GET'])
@jwt_required()
@scope_by_department
def get_agents():
    try:
        role = get_jwt().get('role')
        if role not in ('super_admin', 'admin', 'department'):
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
