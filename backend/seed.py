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
vendor_password = bcrypt.generate_password_hash("User@123").decode('utf-8')

# Insert admin user
conn.execute("""
INSERT INTO users VALUES (
    'USR-10001',
    'Admin User',
    'admin@test.com',
    ?,
    'admin',
    'Operations',
    '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    NULL
)
""", [admin_password])

# Insert user accounts
conn.execute("""
INSERT INTO users VALUES (
    'USR-10002',
    'User One',
    'user1@test.com',
    ?,
    'user',
    'Supply Chain',
    '[1,2,4,6,11,14]',
    'VEND-001',
    true,
    CURRENT_TIMESTAMP,
    NULL
)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES (
    'USR-10003',
    'User Two',
    'user2@test.com',
    ?,
    'user',
    'Inventory',
    '[2,3,8,9,10,12]',
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
    (5, 'Documentation', 'Document and compliance issues', 'documents'),
    (6, 'Order Discrepancies', 'Mismatched order quantities or items', 'order'),
    (7, 'User Onboarding', 'Registration and profile setup queries', 'onboarding'),
    (8, 'Quality Control', 'Product quality and damage complaints', 'quality'),
    (9, 'Pricing & Billing', 'Pricing disputes and billing inquiries', 'billing'),
    (10, 'SLA Violations', 'SLA delays and performance escalations', 'sla'),
    (11, 'Logistics Support', 'Transport, routing, and carrier issues', 'logistics'),
    (12, 'Database & Sync', 'Data mismatch and sync issues', 'database'),
    (13, 'Account & Security', 'Security settings and account recovery', 'security'),
    (14, 'Refunds & Returns', 'Product return requests and refunds', 'returns'),
    (15, 'Compliance & Audits', 'Regulatory, policy, and audit support', 'compliance'),
    (16, 'Vendor Management', 'Vendor onboarding, agreements, and disputes', 'vendor'),
    (17, 'Store Operations', 'In-store operational queries and escalations', 'operations'),
    (18, 'HR & Workforce', 'Staff queries, attendance, and HR support', 'hr'),
    (19, 'IT Infrastructure', 'Network, hardware, and system outages', 'infrastructure'),
    (20, 'Finance & Reporting', 'Financial reports, budgets, and reconciliation', 'finance')
]

for category in categories:
    conn.execute("""
    INSERT INTO categories VALUES (?, ?, ?, ?, true)
    """, category)

conn.close()

print("Seed data inserted successfully!")