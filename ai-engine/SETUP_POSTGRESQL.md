# PostgreSQL Setup Guide for FocusFlow

Complete step-by-step guide to connect PostgreSQL database with FocusFlow API.

## Prerequisites

- PostgreSQL installed on your system
- Python 3.8+ with pip

## Step 1: Install PostgreSQL

### On Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### On macOS:
```bash
brew install postgresql
brew services start postgresql
```

### On Windows:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

## Step 2: Create Database and User

### Option A: Using PostgreSQL Command Line

1. **Access PostgreSQL as superuser:**
```bash
# On Linux
sudo -u postgres psql

# On macOS
psql postgres

# On Windows (from psql shell)
psql -U postgres
```

2. **Create database and user:**
```sql
-- Create the database
CREATE DATABASE focusflow;

-- Create user (if using default, skip if postgres user exists)
CREATE USER postgres WITH PASSWORD 'postgres';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE focusflow TO postgres;

-- Exit psql
\q
```

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `focusflow`
4. Owner: `postgres`
5. Click "Save"

## Step 3: Configure Connection

1. **Copy environment template:**
```bash
cd ai-engine
cp .env.example .env
```

2. **Edit .env file** with your PostgreSQL credentials:
```bash
# Default configuration (if you followed Step 2 exactly)
DATABASE_URL=postgresql://postgres:postgres@localhost/focusflow

# Custom configuration examples:
# Different user: postgresql://myuser:mypassword@localhost/focusflow
# Different port: postgresql://postgres:postgres@localhost:5433/focusflow
# Remote host: postgresql://postgres:postgres@192.168.1.100/focusflow
```

**Connection String Format:**
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

- **username**: PostgreSQL user (default: `postgres`)
- **password**: User's password (default: `postgres`)
- **host**: Database server address (default: `localhost`)
- **port**: PostgreSQL port (default: `5432`, can be omitted)
- **database**: Database name (default: `focusflow`)

## Step 4: Install Python Dependencies

```bash
cd ai-engine
pip install -r requirements.txt
```

This installs:
- `sqlalchemy` - ORM for database operations
- `psycopg2-binary` - PostgreSQL adapter for Python
- `fastapi` - Web framework
- Other dependencies

## Step 5: Test Connection

### Quick Test:
```bash
python -c "from app.database import engine; engine.connect(); print('✅ PostgreSQL connection successful!')"
```

### Start the API:
```bash
# Using run.py
python run.py

# Or using uvicorn directly
uvicorn app.main:app --reload
```

### Verify Tables Created:
```bash
# In PostgreSQL shell
psql -U postgres -d focusflow

# List tables
\dt

# You should see:
# - users
# - sessions
```

Expected output:
```
         List of relations
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | sessions | table | postgres
 public | users    | table | postgres
```

## Step 6: Verify API Works

1. **Open browser to:** `http://localhost:8000/docs`

2. **Test signup endpoint:**
   - Click on `POST /api/auth/signup`
   - Click "Try it out"
   - Enter test data:
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Click "Execute"
   - Should return 201 Created with user data

3. **Verify in database:**
```bash
psql -U postgres -d focusflow
SELECT * FROM users;
SELECT * FROM sessions;
\q
```

## Troubleshooting

### Error: "connection refused"
**Problem:** PostgreSQL server not running

**Solution:**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl status postgresql

# macOS
brew services start postgresql

# Windows
# Start from Services panel or:
pg_ctl start
```

### Error: "role does not exist"
**Problem:** User not created

**Solution:**
```bash
sudo -u postgres psql
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE focusflow TO postgres;
\q
```

### Error: "database does not exist"
**Problem:** Database not created

**Solution:**
```bash
sudo -u postgres psql
CREATE DATABASE focusflow;
\q
```

### Error: "password authentication failed"
**Problem:** Wrong password in DATABASE_URL

**Solution:**
1. Reset PostgreSQL password:
```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'newpassword';
\q
```

2. Update `.env`:
```
DATABASE_URL=postgresql://postgres:newpassword@localhost/focusflow
```

### Error: "peer authentication failed"
**Problem:** PostgreSQL configured for peer authentication

**Solution:**
Edit `/etc/postgresql/[version]/main/pg_hba.conf`:
```bash
# Change this line:
local   all             postgres                                peer

# To:
local   all             postgres                                md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Connection string not working
**Problem:** Special characters in password

**Solution:** URL-encode special characters:
```python
# If password is: my@pass#word
# Encode as: my%40pass%23word
DATABASE_URL=postgresql://postgres:my%40pass%23word@localhost/focusflow
```

## Advanced Configuration

### Using Different Database Name
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE my_focusflow_db;
GRANT ALL PRIVILEGES ON DATABASE my_focusflow_db TO postgres;
\q

# Update .env
DATABASE_URL=postgresql://postgres:postgres@localhost/my_focusflow_db
```

### Using Remote PostgreSQL
```bash
# In .env
DATABASE_URL=postgresql://username:password@remote-server.com:5432/focusflow

# Make sure remote server allows connections:
# - Edit postgresql.conf: listen_addresses = '*'
# - Edit pg_hba.conf: host all all 0.0.0.0/0 md5
# - Open firewall port 5432
```

### Connection Pooling (Production)
```python
# In app/database.py, modify engine creation:
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600    # Recycle connections after 1 hour
)
```

## Database Management

### View all users:
```bash
psql -U postgres -d focusflow
SELECT email, name, created_at FROM users;
```

### Delete all data (reset):
```bash
psql -U postgres -d focusflow
TRUNCATE users, sessions CASCADE;
```

### Backup database:
```bash
pg_dump -U postgres focusflow > focusflow_backup.sql
```

### Restore database:
```bash
psql -U postgres -d focusflow < focusflow_backup.sql
```

## Next Steps

Once PostgreSQL is connected:
1. ✅ Users can signup and login
2. ✅ Sessions are persisted in database
3. ✅ Ready to add new features (study sessions, logs)
4. ✅ Can view/manage data with pgAdmin or command line

## Production Considerations

For production deployment:
- Use strong passwords
- Enable SSL/TLS connections
- Set up database backups
- Configure connection pooling
- Use environment variables (never commit .env)
- Consider managed PostgreSQL (AWS RDS, Google Cloud SQL, Heroku Postgres)
