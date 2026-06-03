import duckdb

conn = duckdb.connect("tickets.db")

print("Messages:")
print(conn.execute("""
SELECT
    message_id,
    ticket_id,
    sender_id,
    sender_role,
    message_text,
    is_ping,
    created_at
FROM messages
ORDER BY created_at DESC
""").fetchdf())

conn.close()