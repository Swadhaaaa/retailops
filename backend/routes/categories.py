from flask import Blueprint, jsonify
from database import get_db

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'])
def get_categories():

    conn = get_db()

    columns = [row[1] for row in conn.execute("PRAGMA table_info('categories')").fetchall()]
    if 'assigned_department' not in columns:
        conn.execute("ALTER TABLE categories ADD COLUMN assigned_department VARCHAR")

    categories = conn.execute("""
        SELECT category_id, name, description, icon, assigned_department
        FROM categories
        WHERE is_active = true
        ORDER BY category_id
    """).fetchall()

    conn.close()

    result = []

    for category in categories:
        result.append({
            'category_id': category[0],
            'name': category[1],
            'description': category[2],
            'icon': category[3],
            'assigned_department': category[4]
        })

    return jsonify(result)
