import duckdb

conn = duckdb.connect('tickets.db')

rows = conn.execute("""
SELECT ticket_id, priority, created_at, sla_deadline
FROM tickets
ORDER BY created_at DESC
LIMIT 5
""").fetchall()

for row in rows:
    print(row)

conn.close()