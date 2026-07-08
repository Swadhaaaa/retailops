import duckdb
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
LEGACY_ADMIN_ROLE = 'super' + '_admin'

CATEGORY_DEPARTMENT_MAP = {
    1: 'Finance',
    2: 'Inventory',
    3: 'IT Support',
    4: 'Logistics',
    5: 'Compliance',
    6: 'Supply Chain',
    7: 'Supply Chain',
    8: 'Inventory',
    9: 'Finance',
    10: 'Operations',
    11: 'Logistics',
    12: 'IT Support',
    13: 'IT Support',
    14: 'Finance',
    15: 'Compliance',
    16: 'Supply Chain',
    17: 'Operations',
    18: 'Operations',
    19: 'IT Support',
    20: 'Finance'
}


def migrate():
    conn = duckdb.connect('tickets.db')

    category_columns = [row[1] for row in conn.execute("PRAGMA table_info('categories')").fetchall()]
    if 'assigned_department' not in category_columns:
        conn.execute("ALTER TABLE categories ADD COLUMN assigned_department VARCHAR")

    columns = [row[1] for row in conn.execute("PRAGMA table_info('tickets')").fetchall()]
    if 'business_unit' not in columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN business_unit VARCHAR")
    if 'assigned_department' not in columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN assigned_department VARCHAR")

    # 1. Keep all admin users under the single admin login role.
    conn.execute("UPDATE users SET role = 'admin' WHERE role = ?", [LEGACY_ADMIN_ROLE])

    # 2. Store category-to-department mapping in the categories table.
    for category_id, department in CATEGORY_DEPARTMENT_MAP.items():
        conn.execute("""
            UPDATE categories
            SET assigned_department = ?
            WHERE category_id = ?
        """, [department, category_id])

    conn.execute("""
        UPDATE categories
        SET assigned_department = 'Operations'
        WHERE assigned_department IS NULL
    """)

    # 3. Backfill tickets from their category's stored department mapping.
    conn.execute("""
        UPDATE tickets
        SET business_unit = COALESCE(c.assigned_department, 'Operations'),
            assigned_department = COALESCE(c.assigned_department, 'Operations'),
            assigned_to = COALESCE(c.assigned_department, 'Operations')
        FROM categories c
        WHERE tickets.category_id = c.category_id
    """)

    conn.execute("UPDATE tickets SET business_unit = 'Operations' WHERE business_unit IS NULL")
    conn.execute("UPDATE tickets SET assigned_department = COALESCE(assigned_department, business_unit, 'Operations')")

    # 4. Seed department login accounts
    # Generate password hash
    password_hash = bcrypt.generate_password_hash('password123').decode('utf-8')

    test_accounts = [
        ('finance_test', 'Finance Department', 'finance@relianceretail.com', password_hash, 'department', 'Finance'),
        ('it_test', 'IT Support Department', 'it@relianceretail.com', password_hash, 'department', 'IT Support'),
        ('ops_test', 'Operations Department', 'ops@relianceretail.com', password_hash, 'department', 'Operations'),
        ('supply_chain_test', 'Supply Chain Department', 'supplychain@relianceretail.com', password_hash, 'department', 'Supply Chain'),
        ('logistics_test', 'Logistics Department', 'logistics@relianceretail.com', password_hash, 'department', 'Logistics'),
        ('inventory_test', 'Inventory Department', 'inventory@relianceretail.com', password_hash, 'department', 'Inventory'),
        ('compliance_test', 'Compliance Department', 'compliance@relianceretail.com', password_hash, 'department', 'Compliance')
    ]

    for acc in test_accounts:
        # Check if exists
        exists = conn.execute("SELECT 1 FROM users WHERE email = ?", [acc[2]]).fetchone()
        if not exists:
            conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, role, department, is_active)
                VALUES (?, ?, ?, ?, ?, ?, true)
            """, acc)
            print(f"Created account: {acc[2]}")
        else:
            conn.execute("""
                UPDATE users
                SET role = ?, department = ?, is_active = true
                WHERE email = ?
            """, [acc[4], acc[5], acc[2]])
            print(f"Account already exists: {acc[2]}")

    conn.close()
    print("Migration complete!")

if __name__ == '__main__':
    migrate()
