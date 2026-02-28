import pymysql

# Try no password and 'root' password
passwords_to_try = ['', 'root', 'password']
success = False

for pwd in passwords_to_try:
    try:
        connection = pymysql.connect(host='localhost', user='root', password=pwd)
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS skillsprint;")
        connection.commit()
        connection.close()
        print(f"Database skillsprint created successfully with password '{pwd}'")
        
        # Update .env
        with open('.env', 'w') as f:
            f.write(f"SECRET_KEY=dev-secret-key\nJWT_SECRET_KEY=dev-jwt-secret\nDATABASE_URL=mysql+pymysql://root:{pwd}@localhost/skillsprint\n")
            
        success = True
        break
    except Exception as e:
        print(f"Failed with password '{pwd}': {e}")

if not success:
    print("WARNING: Could not connect to MySQL as root. Ensure MySQL is running.")
