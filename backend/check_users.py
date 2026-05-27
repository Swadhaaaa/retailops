import duckdb

conn = duckdb.connect('tickets.db')

users = conn.execute("""
    SELECT user_id, name, email, role
    FROM users
""").fetchall()

print(users)

conn.close()