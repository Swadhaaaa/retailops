import os
import duckdb
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv('DB_PATH', 'tickets.db')
LEGACY_ADMIN_ROLE = 'super' + '_admin'


def get_db():
    return duckdb.connect(DB_PATH)


def ensure_column(conn, table_name, column_name, column_type):
    columns = [row[1] for row in conn.execute(f"PRAGMA table_info('{table_name}')").fetchall()]
    if column_name not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")


def init_db():
    conn = get_db()

    conn.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        role_id INTEGER PRIMARY KEY,
        role_name VARCHAR NOT NULL UNIQUE,
        description VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    INSERT OR IGNORE INTO roles (role_id, role_name, description)
    VALUES
        (1, 'admin', 'System administrator'),
        (2, 'department', 'Department agent'),
        (3, 'user', 'End user')
    """)

    conn.execute("""
    UPDATE roles
    SET role_name = 'admin', description = 'System administrator'
    WHERE role_name = ?
      AND NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'admin')
    """, [LEGACY_ADMIN_ROLE])
    conn.execute("DELETE FROM roles WHERE role_name = ?", [LEGACY_ADMIN_ROLE])

    conn.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id INTEGER PRIMARY KEY,
        department_name VARCHAR NOT NULL UNIQUE,
        parent_department_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    INSERT OR IGNORE INTO departments (department_id, department_name, parent_department_id, is_active)
    VALUES
        (1, 'Operations', NULL, true),
        (2, 'Support', NULL, true),
        (3, 'IT', NULL, true),
        (4, 'Finance', NULL, true)
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        role VARCHAR DEFAULT 'user',
        department VARCHAR,
        assigned_categories VARCHAR DEFAULT '[]',
        vendor_id VARCHAR,
        role_id INTEGER,
        department_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        last_login_at TIMESTAMP
    )
    """)

    ensure_column(conn, 'users', 'role_id', 'INTEGER')
    ensure_column(conn, 'users', 'department_id', 'INTEGER')
    ensure_column(conn, 'users', 'updated_at', 'TIMESTAMP')
    ensure_column(conn, 'users', 'last_login_at', 'TIMESTAMP')

    conn.execute("UPDATE users SET role = 'admin' WHERE lower(COALESCE(role, '')) = ?", [LEGACY_ADMIN_ROLE])

    conn.execute("""
    UPDATE users
    SET role_id = COALESCE((
        SELECT role_id
        FROM roles
        WHERE role_name = lower(COALESCE(users.role, ''))
        LIMIT 1
    ), role_id)
    WHERE role_id IS NULL OR lower(COALESCE(role, '')) IN ('admin', 'department', 'user')
    """)

    conn.execute("""
    UPDATE users
    SET department_id = (
        SELECT department_id
        FROM departments
        WHERE lower(department_name) = lower(COALESCE(department, ''))
        LIMIT 1
    )
    WHERE department_id IS NULL AND department IS NOT NULL
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        description VARCHAR,
        icon VARCHAR,
        assigned_department VARCHAR,
        department_id INTEGER,
        is_active BOOLEAN DEFAULT true
    )
    """)

    ensure_column(conn, 'categories', 'department_id', 'INTEGER')

    conn.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        ticket_id VARCHAR PRIMARY KEY,
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER,
        priority VARCHAR DEFAULT 'Medium',
        status VARCHAR DEFAULT 'Open',
        ticket_type VARCHAR,
        raised_by VARCHAR,
        assigned_to VARCHAR,
        attachment_path VARCHAR,
        business_unit VARCHAR,
        assigned_department VARCHAR,
        requester_id VARCHAR,
        assigned_department_id INTEGER,
        assigned_to_user_id VARCHAR,
        source_channel VARCHAR DEFAULT 'web',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        feedback_rating INTEGER,
        resolution_summary TEXT,
        root_cause TEXT,
        action_taken TEXT,
        resolution_remarks TEXT,
        resolution_submitted_by VARCHAR,
        resolution_submitted_at TIMESTAMP,
        claimed_by VARCHAR,
        claimed_at TIMESTAMP,
        resolved_by VARCHAR,
        reopened_count INTEGER DEFAULT 0,
        escalation_count INTEGER DEFAULT 0,
        documents_verified BOOLEAN DEFAULT false,
        issue_investigated BOOLEAN DEFAULT false,
        requester_updated BOOLEAN DEFAULT false,
        final_confirmation_done BOOLEAN DEFAULT false
    )
    """)

    ensure_column(conn, 'tickets', 'requester_id', 'VARCHAR')
    ensure_column(conn, 'tickets', 'assigned_department_id', 'INTEGER')
    ensure_column(conn, 'tickets', 'assigned_to_user_id', 'VARCHAR')
    ensure_column(conn, 'tickets', 'source_channel', 'VARCHAR')
    ensure_column(conn, 'tickets', 'updated_at', 'TIMESTAMP')

    conn.execute("""
    UPDATE tickets
    SET assigned_department = COALESCE(assigned_department, business_unit)
    WHERE assigned_department IS NULL
    """)

    conn.execute("""
    UPDATE tickets
    SET requester_id = COALESCE(requester_id, raised_by)
    WHERE requester_id IS NULL
    """)

    conn.execute("""
    UPDATE tickets
    SET assigned_to_user_id = COALESCE(assigned_to_user_id, assigned_to)
    WHERE assigned_to_user_id IS NULL
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_activity (
        activity_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        action_type VARCHAR NOT NULL,
        action_text TEXT NOT NULL,
        actor_id VARCHAR,
        actor_role VARCHAR DEFAULT 'system',
        from_value VARCHAR,
        to_value VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_internal_notes (
        note_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        note_text TEXT NOT NULL,
        created_by VARCHAR,
        created_by_name VARCHAR,
        created_by_role VARCHAR DEFAULT 'department',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_escalations (
        escalation_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        from_department VARCHAR,
        to_department VARCHAR NOT NULL,
        reason TEXT NOT NULL,
        escalated_by VARCHAR,
        escalated_by_name VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_comments (
        comment_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        author_id VARCHAR NOT NULL,
        body TEXT NOT NULL,
        comment_type VARCHAR DEFAULT 'comment',
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_attachments (
        attachment_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        uploaded_by VARCHAR,
        file_name VARCHAR NOT NULL,
        stored_path VARCHAR NOT NULL,
        mime_type VARCHAR,
        file_size_bytes INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY,
        user_id VARCHAR NOT NULL,
        ticket_id VARCHAR,
        title VARCHAR,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_status_history (
        history_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        from_status VARCHAR NOT NULL,
        to_status VARCHAR NOT NULL,
        changed_by VARCHAR,
        reason TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id INTEGER PRIMARY KEY,
        actor_id VARCHAR,
        entity_type VARCHAR NOT NULL,
        entity_id VARCHAR NOT NULL,
        action VARCHAR NOT NULL,
        details VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS ticket_assignments (
        assignment_id INTEGER PRIMARY KEY,
        ticket_id VARCHAR NOT NULL,
        assignee_id VARCHAR,
        department_id INTEGER,
        assigned_by VARCHAR,
        assignment_type VARCHAR DEFAULT 'manual',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unassigned_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        announcement_id INTEGER PRIMARY KEY,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR,
        effective_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("CREATE INDEX IF NOT EXISTS idx_users_role_department_active ON users (role, department, is_active)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status_priority_created ON tickets (status, priority, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tickets_requester_created ON tickets (requester_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_created ON ticket_comments (ticket_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_created ON ticket_attachments (ticket_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications (user_id, is_read, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_changed ON ticket_status_history (ticket_id, changed_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON audit_logs (entity_type, entity_id, created_at)")

    conn.close()
    print("DuckDB database initialized successfully")


if __name__ == '__main__':
    init_db()
