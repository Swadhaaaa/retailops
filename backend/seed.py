from database import get_db
from flask_bcrypt import Bcrypt
import json

bcrypt = Bcrypt()

conn = get_db()

# Clear old data
conn.execute("DELETE FROM users")
conn.execute("DELETE FROM categories")
conn.execute("DELETE FROM tickets")
# TEMPORARILY DISABLED - MESSAGES FEATURE
# conn.execute("DELETE FROM messages")

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
INSERT INTO users VALUES ('USR-10002', 'User One', 'user1@test.com', ?, 'user', 'Supply Chain', '[1,2,4,6,11,14]', 'VEND-001', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10003', 'User Two', 'user2@test.com', ?, 'user', 'Inventory', '[2,3,8,9,10,12]', 'VEND-002', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10004', 'ABC Suppliers Ltd', 'abc@test.com', ?, 'user', 'Operations', '[1,2,3,4,5,6,7,8,9,10]', 'VEND-ABC', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10005', 'XYZ Logistics', 'xyz@test.com', ?, 'user', 'Logistics', '[1,2,3,4,5,6,7,8,9,10]', 'VEND-XYZ', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10006', 'Global Tech Corp', 'global@test.com', ?, 'user', 'IT Support', '[1,2,3,4,5,6,7,8,9,10]', 'VEND-GLOBAL', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10007', 'Prime Distributors', 'prime@test.com', ?, 'user', 'Finance', '[1,2,3,4,5,6,7,8,9,10]', 'VEND-PRIME', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

conn.execute("""
INSERT INTO users VALUES ('USR-10008', 'Smart Solutions', 'smart@test.com', ?, 'user', 'Compliance', '[1,2,3,4,5,6,7,8,9,10]', 'VEND-SMART', true, CURRENT_TIMESTAMP, NULL)
""", [vendor_password])

# Insert categories
categories = [
    (1, 'Payment Issue', 'Invoice and payment related issues', 'payment', 'Finance'),
    (2, 'Inventory Issues', 'Stock and inventory problems', 'inventory', 'Inventory'),
    (3, 'Portal Access', 'System and technical support', 'technical', 'IT Support'),
    (4, 'Delivery Issues', 'Shipment and delivery concerns', 'delivery', 'Logistics'),
    (5, 'Contract Query', 'Document and compliance issues', 'documents', 'Compliance'),
    (6, 'Order Discrepancies', 'Mismatched order quantities or items', 'order', 'Supply Chain'),
    (7, 'User Onboarding', 'Registration and profile setup queries', 'onboarding', 'Supply Chain'),
    (8, 'Quality Control', 'Product quality and damage complaints', 'quality', 'Inventory'),
    (9, 'Pricing & Billing', 'Pricing disputes and billing inquiries', 'billing', 'Finance'),
    (10, 'SLA Violations', 'SLA delays and performance escalations', 'sla', 'Operations'),
    (11, 'Logistics Support', 'Transport, routing, and carrier issues', 'logistics', 'Logistics'),
    (12, 'Database & Sync', 'Data mismatch and sync issues', 'database', 'IT Support'),
    (13, 'Account & Security', 'Security settings and account recovery', 'security', 'IT Support'),
    (14, 'Refunds & Returns', 'Product return requests and refunds', 'returns', 'Finance'),
    (15, 'GST Compliance', 'Regulatory, policy, and audit support', 'compliance', 'Compliance'),
    (16, 'KYC Verification', 'User onboarding, agreements, and disputes', 'vendor', 'Supply Chain'),
    (17, 'Store Operations', 'In-store operational queries and escalations', 'operations', 'Operations'),
    (18, 'HR & Workforce', 'Staff queries, attendance, and HR support', 'hr', 'Operations'),
    (19, 'IT Infrastructure', 'Network, hardware, and system outages', 'infrastructure', 'IT Support'),
    (20, 'Finance & Reporting', 'Financial reports, budgets, and reconciliation', 'finance', 'Finance')
]

for category in categories:
    conn.execute("""
    INSERT INTO categories (
        category_id, name, description, icon, assigned_department, is_active
    )
    VALUES (?, ?, ?, ?, ?, true)
    """, category)

# Seed Announcements
conn.execute("DELETE FROM announcements")
announcements = [
    (1, 'System Maintenance', 'Scheduled on 10 Jun 2026, 02:00 AM', 'maintenance', '2026-06-10 02:00:00'),
    (2, 'New User Guidelines', 'Effective from 01 Jun 2026', 'guidelines', '2026-06-01 00:00:00'),
    (3, 'SLA Policy Updates', 'Effective from 15 May 2026', 'sla', '2026-05-15 00:00:00')
]
for ann in announcements:
    conn.execute("""
    INSERT INTO announcements VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, ann)


conn.close()

print("Seed data inserted successfully!")
