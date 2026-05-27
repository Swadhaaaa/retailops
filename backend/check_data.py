import duckdb

conn = duckdb.connect('tickets.db')

print("\nUSERS:")
print(conn.execute("""
SELECT user_id, name, role
FROM users
""").fetchall())

print("\nCATEGORIES:")
print(conn.execute("""
SELECT category_id, name
FROM categories
""").fetchall())

conn.close()