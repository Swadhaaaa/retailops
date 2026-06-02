import duckdb

conn = duckdb.connect("tickets.db")

print("Tables:")
print(conn.execute("SHOW TABLES").fetchall())

print("\nTickets:")
print(conn.execute("""
SELECT ticket_id, title, priority, status
FROM tickets
""").fetchdf())

conn.close()