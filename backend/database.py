import duckdb
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv('DB_PATH', 'tickets.db')

def get_db():
    return duckdb.connect(DB_PATH)

def init_db():
    conn = get_db()

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
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY,
        name VARCHAR NOT NULL,
        description VARCHAR,
        icon VARCHAR,
        assigned_department VARCHAR,
        is_active BOOLEAN DEFAULT true
    )
    """)

    category_columns = [
        row[1]
        for row in conn.execute("PRAGMA table_info('categories')").fetchall()
    ]

    if 'assigned_department' not in category_columns:
        conn.execute("ALTER TABLE categories ADD COLUMN assigned_department VARCHAR")

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        feedback_rating INTEGER,
        sla_deadline TIMESTAMP
    )
    """)

    ticket_columns = [
        row[1]
        for row in conn.execute("PRAGMA table_info('tickets')").fetchall()
    ]

    if 'business_unit' not in ticket_columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN business_unit VARCHAR")

    if 'assigned_department' not in ticket_columns:
        conn.execute("ALTER TABLE tickets ADD COLUMN assigned_department VARCHAR")

    conn.execute("""
        UPDATE tickets
        SET assigned_department = COALESCE(assigned_department, business_unit)
        WHERE assigned_department IS NULL
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

    # TEMPORARILY DISABLED - MESSAGES FEATURE
    # conn.execute("""
    # CREATE TABLE IF NOT EXISTS messages (
    #     message_id INTEGER,
    #     ticket_id VARCHAR,
    #     sender_id VARCHAR,
    #     sender_role VARCHAR,
    #     message_text TEXT,
    #     is_ping BOOLEAN DEFAULT false,
    #     attachment_path VARCHAR,
    #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    # )
    # """)

    #  MESSAGES FEATURE
    # conn.execute("""
    # CREATE TABLE IF NOT EXISTS notifications (
    #     notif_id INTEGER,
    #     user_id VARCHAR,
    #     ticket_id VARCHAR,
    #     message TEXT,
    #     is_read BOOLEAN DEFAULT false,
    #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    # )
    # """)

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

    # Migration checks
    # TEMPORARILY DISABLED - MESSAGES FEATURE
    # try:
    #     columns = [row[1] for row in conn.execute("PRAGMA table_info('messages')").fetchall()]
    #     if 'attachment_path' not in columns:
    #         conn.execute("ALTER TABLE messages ADD COLUMN attachment_path VARCHAR")
    # except Exception as e:
    #     print(f"Migration error for messages table: {e}")

    conn.close()

    print("Database initialized!")

if __name__ == '__main__':
    init_db()
