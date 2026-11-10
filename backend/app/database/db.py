import sqlite3
from typing import Optional, List, Dict, Any
from pathlib import Path
import bcrypt

from app.config import settings

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_db_connection() -> sqlite3.Connection:
    """Get a SQLite database connection with row access by column name."""
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize SQLite database tables and seed demo accounts if not present."""
    db_file = Path(settings.DATABASE_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Employee table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT NOT NULL,
                designation TEXT NOT NULL,
                annual_leave_balance INTEGER NOT NULL DEFAULT 0,
                medical_leave_used INTEGER NOT NULL DEFAULT 0,
                reporting_manager TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Documents metadata table with versioning support
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                policy_name TEXT NOT NULL DEFAULT '',
                version INTEGER NOT NULL DEFAULT 1,
                is_latest INTEGER NOT NULL DEFAULT 1,
                description TEXT DEFAULT '',
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                uploaded_by TEXT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Run migration if columns don't exist yet in existing database
        cursor.execute("PRAGMA table_info(documents)")
        existing_doc_cols = [row["name"] for row in cursor.fetchall()]
        if "policy_name" not in existing_doc_cols:
            cursor.execute("ALTER TABLE documents ADD COLUMN policy_name TEXT DEFAULT ''")
        if "version" not in existing_doc_cols:
            cursor.execute("ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1")
        if "is_latest" not in existing_doc_cols:
            cursor.execute("ALTER TABLE documents ADD COLUMN is_latest INTEGER DEFAULT 1")
        if "description" not in existing_doc_cols:
            cursor.execute("ALTER TABLE documents ADD COLUMN description TEXT DEFAULT ''")

        # Backfill policy_name for existing records if empty
        cursor.execute("""
            UPDATE documents 
            SET policy_name = replace(replace(replace(filename, '.pdf', ''), '_', ' '), '-', ' ')
            WHERE policy_name = '' OR policy_name IS NULL
        """)

        # Chat History table for persistent conversation storage
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations_json TEXT DEFAULT NULL,
                is_personalized INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_history_emp ON chat_history(employee_id, id ASC)")

        # Check if designation column exists in employees table (for schema migration)
        cursor.execute("PRAGMA table_info(employees)")
        existing_emp_cols = [row["name"] for row in cursor.fetchall()]
        if "designation" not in existing_emp_cols:
            cursor.execute("ALTER TABLE employees ADD COLUMN designation TEXT DEFAULT ''")

        # Seed Admin account (admin@gmail.com)
        cursor.execute("SELECT id FROM employees WHERE email = ?", ("admin@gmail.com",))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO employees (
                    employee_id, name, email, password_hash, role,
                    department, designation, annual_leave_balance,
                    medical_leave_used, reporting_manager
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "ADM001",
                "HR Administrator",
                "admin@gmail.com",
                hash_password(settings.ADMIN_PASSWORD),
                "admin",
                "Human Resources",
                "HR Manager",
                20,
                1,
                "Chief People Officer"
            ))
        else:
            cursor.execute("""
                UPDATE employees 
                SET designation = 'HR Manager' 
                WHERE email = 'admin@gmail.com' OR employee_id = 'ADM001'
            """)

        # Seed Employee account (employee@gmail.com)
        cursor.execute("SELECT id FROM employees WHERE email = ?", ("employee@gmail.com",))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO employees (
                    employee_id, name, email, password_hash, role,
                    department, designation, annual_leave_balance,
                    medical_leave_used, reporting_manager
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EMP001",
                "Jane Doe",
                "employee@gmail.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Software Engineering",
                "AI/ML Intern",
                14,
                3,
                "Alex Johnson"
            ))
        else:
            cursor.execute("""
                UPDATE employees 
                SET designation = 'AI/ML Intern' 
                WHERE email = 'employee@gmail.com' OR employee_id = 'EMP001'
            """)

        # Seed 8 additional sample employee records
        sample_employees = [
            (
                "EMP002",
                "Michael Chen",
                "mchen@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Software Engineering",
                "Senior Backend Engineer",
                15,
                2,
                "David Vance"
            ),
            (
                "EMP003",
                "Sarah Jenkins",
                "sjenkins@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Product & Design",
                "Lead Product Designer",
                18,
                1,
                "Elena Rostova"
            ),
            (
                "EMP004",
                "David Vance",
                "dvance@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Software Engineering",
                "Engineering Director",
                22,
                0,
                "Chief Technology Officer"
            ),
            (
                "EMP005",
                "Priya Sharma",
                "psharma@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Data & AI",
                "Senior Data Scientist",
                12,
                4,
                "David Vance"
            ),
            (
                "EMP006",
                "Marcus Reed",
                "mreed@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Marketing & Growth",
                "Marketing Lead",
                14,
                2,
                "Sophia Taylor"
            ),
            (
                "EMP007",
                "Elena Rostova",
                "erostova@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Product & Design",
                "Principal Product Manager",
                19,
                1,
                "Chief Product Officer"
            ),
            (
                "EMP008",
                "James Wilson",
                "jwilson@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Finance & Operations",
                "Financial Controller",
                16,
                3,
                "Chief Financial Officer"
            ),
            (
                "EMP009",
                "Aisha Patel",
                "apatel@peoplesphere.com",
                hash_password(settings.EMPLOYEE_PASSWORD),
                "employee",
                "Human Resources",
                "HR Business Partner",
                17,
                0,
                "HR Administrator"
            )
        ]

        for emp in sample_employees:
            cursor.execute("SELECT id FROM employees WHERE employee_id = ? OR email = ?", (emp[0], emp[2]))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO employees (
                        employee_id, name, email, password_hash, role,
                        department, designation, annual_leave_balance,
                        medical_leave_used, reporting_manager
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, emp)
            else:
                cursor.execute("""
                    UPDATE employees
                    SET designation = ?, department = ?, reporting_manager = ?
                    WHERE employee_id = ?
                """, (emp[6], emp[5], emp[9], emp[0]))

        conn.commit()

def get_employee_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve full employee record by email (including password hash for authentication)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM employees WHERE email = ?", (email.lower(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_employee_by_id(employee_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve public employee record by employee_id (omitting password hash)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, employee_id, name, email, role, department,
                   designation, annual_leave_balance, medical_leave_used,
                   reporting_manager, created_at
            FROM employees WHERE employee_id = ?
        """, (employee_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_employees() -> List[Dict[str, Any]]:
    """Retrieve all employee records for Admin view (omitting password hash)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, employee_id, name, email, role, department,
                   designation, annual_leave_balance, medical_leave_used,
                   reporting_manager, created_at
            FROM employees ORDER BY role ASC, name ASC
        """)
        return [dict(row) for row in cursor.fetchall()]

def update_employee_record(
    employee_id: str,
    department: Optional[str] = None,
    designation: Optional[str] = None,
    annual_leave_balance: Optional[int] = None,
    medical_leave_used: Optional[int] = None,
    reporting_manager: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Update employee details (Admin only operation)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        fields = []
        params = []
        if department is not None:
            fields.append("department = ?")
            params.append(department)
        if designation is not None:
            fields.append("designation = ?")
            params.append(designation)
        if annual_leave_balance is not None:
            fields.append("annual_leave_balance = ?")
            params.append(annual_leave_balance)
        if medical_leave_used is not None:
            fields.append("medical_leave_used = ?")
            params.append(medical_leave_used)
        if reporting_manager is not None:
            fields.append("reporting_manager = ?")
            params.append(reporting_manager)

        if not fields:
            return get_employee_by_id(employee_id)

        params.append(employee_id)
        query = f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?"
        cursor.execute(query, tuple(params))
        conn.commit()
        return get_employee_by_id(employee_id)

def create_document_record(
    doc_id: str,
    filename: str,
    file_path: str,
    file_size: int,
    chunk_count: int,
    uploaded_by: str,
    policy_name: str = "",
    version: int = 1,
    is_latest: bool = True,
    description: str = ""
):
    """Store document metadata in SQLite with versioning."""
    if not policy_name:
        policy_name = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').strip()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (
                id, filename, policy_name, version, is_latest, description,
                file_path, file_size, chunk_count, uploaded_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            filename,
            policy_name,
            version,
            1 if is_latest else 0,
            description,
            file_path,
            file_size,
            chunk_count,
            uploaded_by
        ))
        conn.commit()

def get_all_documents(latest_only: bool = False) -> List[Dict[str, Any]]:
    """Retrieve document records. If latest_only is True, returns only current active versions."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if latest_only:
            cursor.execute("""
                SELECT * FROM documents
                WHERE is_latest = 1
                ORDER BY policy_name ASC, uploaded_at DESC
            """)
        else:
            cursor.execute("""
                SELECT * FROM documents
                ORDER BY policy_name ASC, version DESC, uploaded_at DESC
            """)
        return [dict(row) for row in cursor.fetchall()]

def get_documents_by_policy_name(policy_name: str) -> List[Dict[str, Any]]:
    """Retrieve all versions of a specific policy by policy name."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM documents
            WHERE LOWER(TRIM(policy_name)) = LOWER(TRIM(?))
            ORDER BY version DESC
        """, (policy_name,))
        return [dict(row) for row in cursor.fetchall()]

def get_unique_policy_names() -> List[str]:
    """Retrieve distinct policy names for selection during upload."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT policy_name FROM documents
            WHERE policy_name IS NOT NULL AND TRIM(policy_name) != ''
            ORDER BY policy_name ASC
        """)
        return [row["policy_name"] for row in cursor.fetchall()]

def set_document_is_latest(doc_id: str, is_latest: bool):
    """Set the is_latest flag for a document."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET is_latest = ? WHERE id = ?", (1 if is_latest else 0, doc_id))
        conn.commit()

def reactivate_document_version(doc_id: str) -> Optional[Dict[str, Any]]:
    """
    Rollback / restore an older document version to become the active latest version.
    Marks all other versions of the same policy as is_latest = 0, and sets target as is_latest = 1.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        doc = cursor.fetchone()
        if not doc:
            return None
        
        policy_name = doc["policy_name"]
        # Set all versions of this policy to 0
        cursor.execute("UPDATE documents SET is_latest = 0 WHERE LOWER(TRIM(policy_name)) = LOWER(TRIM(?))", (policy_name,))
        # Set this version to 1
        cursor.execute("UPDATE documents SET is_latest = 1 WHERE id = ?", (doc_id,))
        conn.commit()

        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        updated = cursor.fetchone()
        return dict(updated) if updated else None

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve document metadata by document ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def delete_document_record(doc_id: str) -> bool:
    """Delete document metadata record from SQLite."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
        return cursor.rowcount > 0

def save_chat_message(
    employee_id: str,
    role: str,
    content: str,
    citations_json: Optional[str] = None,
    is_personalized: bool = False
) -> int:
    """Save a chat message turn to SQLite history."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history (employee_id, role, content, citations_json, is_personalized)
            VALUES (?, ?, ?, ?, ?)
        """, (employee_id, role, content, citations_json, 1 if is_personalized else 0))
        conn.commit()
        return cursor.lastrowid

def get_employee_chat_history(employee_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve recent chat history for an employee in chronological order."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, employee_id, role, content, citations_json, is_personalized, created_at
            FROM (
                SELECT * FROM chat_history
                WHERE employee_id = ?
                ORDER BY id DESC
                LIMIT ?
            ) sub
            ORDER BY id ASC
        """, (employee_id, limit))
        return [dict(row) for row in cursor.fetchall()]

def clear_employee_chat_history(employee_id: str) -> bool:
    """Clear all chat history for an employee."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_history WHERE employee_id = ?", (employee_id,))
        conn.commit()
        return cursor.rowcount > 0

