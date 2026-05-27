import duckdb

conn = duckdb.connect('tickets.db')

users = conn.execute("""
SELECT *
FROM users
""").fetchall()

for user in users:

    if user[10]:
        formatted_time = user[10].strftime("%d-%m-%Y %I:%M %p")
    else:
        formatted_time = "Never Logged In"

    print(f"""
Name: {user[1]}
Email: {user[2]}
Role: {user[4]}
Last Login: {formatted_time}
-------------------------
""")

conn.close()