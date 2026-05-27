from flask import Blueprint, jsonify
import duckdb

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'])
def get_categories():

    conn = duckdb.connect('tickets.db')

    categories = conn.execute("""
        SELECT *
        FROM categories
        WHERE is_active = true
    """).fetchall()

    conn.close()

    result = []

    for category in categories:
        result.append({
            'category_id': category[0],
            'name': category[1],
            'description': category[2]
        })

    return jsonify(result)