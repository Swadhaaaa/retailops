import duckdb

conn = duckdb.connect("tickets.db")

print("Notifications:")
print(conn.execute("""
SELECT
    notif_id,
    user_id,
    ticket_id,
    message,
    is_read,
    created_at
FROM notifications
ORDER BY created_at DESC
""").fetchdf())

conn.close()