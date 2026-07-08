from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from routes.auth import auth_bp
from routes.tickets import tickets_bp
from routes.categories import categories_bp
from database import init_db

import os

load_dotenv()

app = Flask(__name__)

CORS(app)
init_db()

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

jwt = JWTManager(app)

# Register Auth Blueprint
app.register_blueprint(
    auth_bp,
    url_prefix='/api/auth'
)

# Register Tickets Blueprint
app.register_blueprint(
    tickets_bp,
    url_prefix='/api/tickets'
)

from routes.user import user_bp

# Register Categories Blueprint
app.register_blueprint(
    categories_bp,
    url_prefix='/api/categories'
)

# Register User Blueprint
app.register_blueprint(
    user_bp,
    url_prefix='/api/users'
)

@app.route('/')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'QMS Retail API v1.0'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)