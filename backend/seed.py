from database import get_db
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()


def seed_data():
    conn = get_db()

    # Check whether users already exist
    user_count = conn.execute(
        "SELECT COUNT(*) FROM users"
    ).fetchone()[0]

    # If users already exist, don't seed again
    if user_count > 0:
        conn.close()
        print("Seed data already exists. Skipping seed.")
        return

    print("No users found. Creating seed data...")

    # Hash passwords
    admin_password = bcrypt.generate_password_hash(
        "Admin@123"
    ).decode("utf-8")

    vendor_password = bcrypt.generate_password_hash(
        "User@123"
    ).decode("utf-8")

    # ---------------------------------------------------------
    # INSERT ADMIN USER
    # ---------------------------------------------------------

    conn.execute("""
    INSERT INTO users (
        user_id, name, email, password_hash, role, department,
        assigned_categories, vendor_id, is_active, created_at, last_login
    ) VALUES (
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

    # ---------------------------------------------------------
    # INSERT USER ACCOUNTS
    # ---------------------------------------------------------

    users = [
        (
            'USR-10002',
            'User One',
            'user1@test.com',
            'Supply Chain',
            '[1,2,4,6,11,14]',
            'VEND-001'
        ),
        (
            'USR-10003',
            'User Two',
            'user2@test.com',
            'Inventory',
            '[2,3,8,9,10,12]',
            'VEND-002'
        ),
        (
            'USR-10004',
            'ABC Suppliers Ltd',
            'abc@test.com',
            'Operations',
            '[1,2,3,4,5,6,7,8,9,10]',
            'VEND-ABC'
        ),
        (
            'USR-10005',
            'XYZ Logistics',
            'xyz@test.com',
            'Logistics',
            '[1,2,3,4,5,6,7,8,9,10]',
            'VEND-XYZ'
        ),
        (
            'USR-10006',
            'Global Tech Corp',
            'global@test.com',
            'IT Support',
            '[1,2,3,4,5,6,7,8,9,10]',
            'VEND-GLOBAL'
        ),
        (
            'USR-10007',
            'Prime Distributors',
            'prime@test.com',
            'Finance',
            '[1,2,3,4,5,6,7,8,9,10]',
            'VEND-PRIME'
        ),
        (
            'USR-10008',
            'Smart Solutions',
            'smart@test.com',
            'Compliance',
            '[1,2,3,4,5,6,7,8,9,10]',
            'VEND-SMART'
        )
    ]

    for user in users:
        conn.execute("""
        INSERT INTO users (
            user_id,
            name,
            email,
            password_hash,
            role,
            department,
            assigned_categories,
            vendor_id,
            is_active,
            created_at,
            last_login
        )
        VALUES (?, ?, ?, ?, 'user', ?, ?, ?, true, CURRENT_TIMESTAMP, NULL)
        """, [
            user[0],
            user[1],
            user[2],
            vendor_password,
            user[3],
            user[4],
            user[5]
        ])

    # ---------------------------------------------------------
    # INSERT CATEGORIES
    # ---------------------------------------------------------

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
        (10, 'Service Delays', 'Service delays and performance escalations', 'operations', 'Operations'),
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
            category_id,
            name,
            description,
            icon,
            assigned_department,
            is_active
        )
        VALUES (?, ?, ?, ?, ?, true)
        """, category)

    # ---------------------------------------------------------
    # INSERT ANNOUNCEMENTS
    # ---------------------------------------------------------

    announcements = [
        (
            1,
            'System Maintenance',
            'Scheduled on 10 Jun 2026, 02:00 AM',
            'maintenance',
            '2026-06-10 02:00:00'
        ),
        (
            2,
            'New User Guidelines',
            'Effective from 01 Jun 2026',
            'guidelines',
            '2026-06-01 00:00:00'
        ),
        (
            3,
            'Support Policy Updates',
            'Effective from 15 May 2026',
            'operations',
            '2026-05-15 00:00:00'
        )
    ]

    for announcement in announcements:
        conn.execute("""
        INSERT INTO announcements (
            announcement_id,
            title,
            content,
            category,
            effective_date,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, announcement)

    conn.close()

    print("Seed data inserted successfully!")


if __name__ == "__main__":
    seed_data()