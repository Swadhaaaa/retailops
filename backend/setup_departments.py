import duckdb
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def get_department_for_category(category_name):
    if not category_name:
        return 'Operations'
    name = category_name.lower()
    if any(term in name for term in [
        'payment', 'billing', 'pricing', 'finance', 'budget',
        'reconciliation', 'refund', 'return'
    ]):
        return 'Finance'
    if any(term in name for term in [
        'portal', 'technical', 'database', 'sync', 'it ',
        'infrastructure', 'security', 'account'
    ]):
        return 'IT Support'
    if any(term in name for term in ['compliance', 'gst', 'contract']):
        return 'Compliance'
    if any(term in name for term in ['kyc', 'vendor', 'order']):
        return 'Supply Chain'
    if 'logistics' in name or 'delivery' in name:
        return 'Logistics'
    if 'inventory' in name or 'stock' in name:
        return 'Inventory'
    return 'Operations'


def migrate():
    conn = duckdb.connect('tickets.db')

    # 1. Migrate admin to super_admin
    conn.execute("UPDATE users SET role = 'super_admin' WHERE role = 'admin'")

    # 2. Backfill business_unit on tickets from their category.
    categories = conn.execute("""
        SELECT category_id, name
        FROM categories
    """).fetchall()

    for category_id, category_name in categories:
        conn.execute("""
            UPDATE tickets
            SET business_unit = ?
            WHERE category_id = ?
        """, [get_department_for_category(category_name), category_id])

    conn.execute("UPDATE tickets SET business_unit = 'Operations' WHERE business_unit IS NULL")

    # 3. Seed department login accounts
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
