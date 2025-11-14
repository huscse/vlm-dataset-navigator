import psycopg
from psycopg.rows import dict_row

def get_conn():
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="navis",
        user="navis",
        password="navis",
        row_factory=dict_row,  # dict rows like RealDictCursor
    )
