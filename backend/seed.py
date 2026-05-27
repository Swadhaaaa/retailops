from database import get_db
from flask_bcrypt import Bcrypt
import json

bcrypt = Bcrypt()

conn = get_db()

# Clear old data
conn.execute("DELETE FROM users")
conn.execute("DELETE FROM categories")

# Hash passwords
admin_password = bcrypt.generate_password_hash("Admin@123").decode('utf-8')
vendor_password = bcrypt.generate_password_hash("Vendor@123").decode('utf-8')

# Insert admin user
conn.execute("""
INSERT INTO users VALUES (
    'USR-10001',
    'Admin User',
    'admin@test.com',
    ?,
    'admin',
    'Operations',
    '[1,2,3,4,5]',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    NULL
)
""", [admin_password])

# Insert vendor users
conn.execute("""
INSERT INTO users VALUES (
    'USR-10002',
    'Vendor One',
    'vendor1@test.com',
    ?,
    'user',
    'Supply Chain',
    '[1,2]',
    'VEND-001',
    true,
    CURRENT_TIMESTAMP,
    NULL
)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES (
    'USR-10003',
    'Vendor Two',
    'vendor2@test.com',
    ?,
    'user',
    'Inventory',
    '[3,4]',
    'VEND-002',
    true,
    CURRENT_TIMESTAMP,
    NULL
)
""", [vendor_password])

# Insert categories
categories = [
    (1, 'Payment Issues', 'Invoice and payment related issues', 'payment'),
    (2, 'Inventory Issues', 'Stock and inventory problems', 'inventory'),
    (3, 'Technical Support', 'System and technical support', 'technical'),
    (4, 'Delivery Issues', 'Shipment and delivery concerns', 'delivery'),
    (5, 'Documentation', 'Document and compliance issues', 'documents')
]

for category in categories:
    conn.execute("""
    INSERT INTO categories VALUES (?, ?, ?, ?, true)
    """, category)

conn.close()

print("Seed data inserted successfully!")