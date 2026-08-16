from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from routes.auth import auth_bp
from routes.tickets import tickets_bp
from routes.categories import categories_bp
from routes.user import user_bp
from database import init_db
from seed import seed_data

import os

load_dotenv()

app = Flask(__name__)

# Enable CORS so the Vercel frontend can communicate with Render
CORS(app)

# Initialize the database
init_db()

# Create demo/initial data only if the database is empty
seed_data()

# JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

jwt = JWTManager(app)

# ---------------------------------------------------------
# REGISTER BLUEPRINTS
# ---------------------------------------------------------

# Authentication
app.register_blueprint(
    auth_bp,
    url_prefix='/api/auth'
)

# Tickets
app.register_blueprint(
    tickets_bp,
    url_prefix='/api/tickets'
)

# Categories
app.register_blueprint(
    categories_bp,
    url_prefix='/api/categories'
)

# Users
app.register_blueprint(
    user_bp,
    url_prefix='/api/users'
)


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.route('/')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'QMS Retail API v1.0'
    })


# ---------------------------------------------------------
# LOCAL DEVELOPMENT
# ---------------------------------------------------------

if __name__ == '__main__':
    app.run(
        debug=True,
        port=5000
    )