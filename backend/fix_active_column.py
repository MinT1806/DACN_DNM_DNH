import psycopg2
from psycopg2 import sql

# Database connection config
DB_HOST = "switchyard.proxy.rlwy.net"
DB_PORT = "37661"
DB_NAME = "railway"
DB_USER = "postgres"
DB_PASSWORD = "hSXOIetUrKHpXRXmZcdWxeGnQYbgQQrt"

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # Check if 'active' column exists in lessons table
    cursor.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'lessons' AND column_name = 'active'
    """)
    if not cursor.fetchone():
        # Add the column with default value true
        cursor.execute("ALTER TABLE lessons ADD COLUMN active BOOLEAN NOT NULL DEFAULT true")
        print("Added 'active' column to lessons table")
    else:
        print("Column 'active' already exists in lessons table")

    cursor.close()
    conn.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
