import duckdb

conn = duckdb.connect("tickets.db")

print("Tables:")
print(conn.execute("SHOW TABLES").fetchall())

print("\nTickets:")
print(conn.execute("""
SELECT
    ticket_id,
    title,
    priority,
    status,
    attachment_path
FROM tickets
ORDER BY created_at DESC 
""").fetchdf())

conn.close()