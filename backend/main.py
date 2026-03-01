from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import sqlite3
import uvicorn
import os

app = FastAPI(title="SwasthiQ Pharmacy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "pharmacy.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT NOT NULL,
            generic_name TEXT,
            category TEXT,
            batch_no TEXT,
            expiry_date TEXT,
            quantity INTEGER DEFAULT 0,
            cost_price REAL DEFAULT 0,
            mrp REAL DEFAULT 0,
            supplier TEXT,
            status TEXT DEFAULT 'Active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_no TEXT UNIQUE NOT NULL,
            patient_name TEXT,
            items_count INTEGER DEFAULT 0,
            total_amount REAL DEFAULT 0,
            payment_mode TEXT DEFAULT 'Cash',
            status TEXT DEFAULT 'Completed',
            sale_date TEXT DEFAULT CURRENT_DATE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_no TEXT UNIQUE NOT NULL,
            supplier TEXT,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            order_date TEXT DEFAULT CURRENT_DATE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("SELECT COUNT(*) FROM medicines")
    if c.fetchone()[0] == 0:
        medicines = [
            ("Paracetamol 650mg", "Acetaminophen", "Analgesic", "PCM-2024-0892", "2026-08-20", 500, 15.00, 25.00, "MedSupply Co.", "Active"),
            ("Omeprazole 20mg Capsule", "Omeprazole", "Gastric", "OMP-2024-5873", "2025-11-10", 45, 65.00, 95.75, "HealthCare Ltd.", "Low Stock"),
            ("Aspirin 75mg", "Aspirin", "Anticoagulant", "ASP-2023-3421", "2024-09-30", 300, 20.00, 45.00, "GreenMed", "Expired"),
            ("Atorvastatin 10mg", "Atorvastatin Besylate", "Cardiovascular", "AME-2024-0945", "2025-10-15", 0, 145.00, 195.00, "PharmaCorp", "Out of Stock"),
            ("Metformin 500mg", "Metformin HCL", "Antidiabetic", "MET-2024-1122", "2026-05-30", 200, 18.00, 32.00, "MedSupply Co.", "Active"),
            ("Amoxicillin 500mg", "Amoxicillin", "Antibiotic", "AMX-2024-3344", "2026-01-20", 150, 45.00, 75.00, "PharmaCorp", "Active"),
            ("Cetirizine 10mg", "Cetirizine HCL", "Antihistamine", "CET-2024-5566", "2025-12-10", 30, 12.00, 22.00, "HealthCare Ltd.", "Low Stock"),
            ("Pantoprazole 40mg", "Pantoprazole", "Gastric", "PAN-2024-7788", "2026-03-15", 120, 55.00, 85.00, "GreenMed", "Active"),
            ("Losartan 50mg", "Losartan Potassium", "Antihypertensive", "LOS-2024-9900", "2025-09-25", 80, 35.00, 60.00, "MedSupply Co.", "Active"),
            ("Vitamin D3 1000IU", "Cholecalciferol", "Supplement", "VTD-2024-1234", "2027-01-10", 250, 8.00, 15.00, "PharmaCorp", "Active"),
        ]
        c.executemany("""
            INSERT INTO medicines (medicine_name, generic_name, category, batch_no, expiry_date, quantity, cost_price, mrp, supplier, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, medicines)

    c.execute("SELECT COUNT(*) FROM sales")
    if c.fetchone()[0] == 0:
        sales = [
            ("INV-2024-1234", "Rajesh Kumar", 3, 340, "Card", "Completed", date.today().isoformat()),
            ("INV-2024-1235", "Sarah Smith", 2, 145, "Cash", "Completed", date.today().isoformat()),
            ("INV-2024-1236", "Michael Johnson", 5, 525, "UPI", "Completed", date.today().isoformat()),
            ("INV-2024-1237", "Priya Nair", 1, 95.75, "Cash", "Completed", date.today().isoformat()),
            ("INV-2024-1238", "Arun Mehta", 4, 418, "Card", "Pending", date.today().isoformat()),
        ]
        c.executemany("""
            INSERT INTO sales (invoice_no, patient_name, items_count, total_amount, payment_mode, status, sale_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, sales)

    c.execute("SELECT COUNT(*) FROM purchase_orders")
    if c.fetchone()[0] == 0:
        orders = [
            ("PO-2024-001", "MedSupply Co.", 12500, "Pending", date.today().isoformat()),
            ("PO-2024-002", "PharmaCorp", 8750, "Pending", date.today().isoformat()),
            ("PO-2024-003", "HealthCare Ltd.", 5200, "Approved", date.today().isoformat()),
            ("PO-2024-004", "GreenMed", 3800, "Pending", date.today().isoformat()),
            ("PO-2024-005", "MedSupply Co.", 9600, "Completed", date.today().isoformat()),
        ]
        c.executemany("""
            INSERT INTO purchase_orders (order_no, supplier, total_amount, status, order_date)
            VALUES (?, ?, ?, ?, ?)
        """, orders)

    conn.commit()
    conn.close()

init_db()

# ─── Models ─────────────────────────────────────────────────────────────────

class MedicineCreate(BaseModel):
    medicine_name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity: int = 0
    cost_price: float = 0
    mrp: float = 0
    supplier: Optional[str] = None
    status: str = "Active"

class MedicineUpdate(BaseModel):
    medicine_name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity: Optional[int] = None
    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    supplier: Optional[str] = None
    status: Optional[str] = None

class SaleCreate(BaseModel):
    patient_name: str
    items_count: int
    total_amount: float
    payment_mode: str = "Cash"

# ─── Dashboard APIs ──────────────────────────────────────────────────────────

@app.get("/api/dashboard/sales-summary")
def get_sales_summary():
    conn = get_db()
    c = conn.cursor()
    today = date.today().isoformat()
    c.execute("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM sales WHERE sale_date = ?", (today,))
    row = c.fetchone()
    conn.close()
    return {
        "today_sales": row["total"],
        "transaction_count": row["count"],
        "growth_percent": 12.5
    }

@app.get("/api/dashboard/items-sold")
def get_items_sold():
    conn = get_db()
    c = conn.cursor()
    today = date.today().isoformat()
    c.execute("SELECT COALESCE(SUM(items_count), 0) as total FROM sales WHERE sale_date = ?", (today,))
    row = c.fetchone()
    conn.close()
    return {"items_sold_today": row["total"]}

@app.get("/api/dashboard/low-stock")
def get_low_stock():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM medicines WHERE status IN ('Low Stock', 'Out of Stock')")
    row = c.fetchone()
    conn.close()
    return {"low_stock_count": row["count"]}

@app.get("/api/dashboard/purchase-orders")
def get_purchase_orders():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as pending FROM purchase_orders WHERE status = 'Pending'")
    row = c.fetchone()
    conn.close()
    return {"total_value": row["total"], "pending_count": row["pending"]}

@app.get("/api/dashboard/recent-sales")
def get_recent_sales(limit: int = 10):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM sales ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ─── Inventory APIs ──────────────────────────────────────────────────────────

@app.get("/api/inventory/overview")
def get_inventory_overview():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM medicines")
    total = c.fetchone()["total"]
    c.execute("SELECT COUNT(*) as active FROM medicines WHERE status = 'Active'")
    active = c.fetchone()["active"]
    c.execute("SELECT COUNT(*) as low FROM medicines WHERE status = 'Low Stock'")
    low = c.fetchone()["low"]
    c.execute("SELECT COALESCE(SUM(quantity * mrp), 0) as value FROM medicines")
    value = c.fetchone()["value"]
    conn.close()
    return {"total_items": total, "active_stock": active, "low_stock": low, "total_value": value}

@app.get("/api/inventory/medicines")
def list_medicines(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = 1,
    limit: int = 20
):
    conn = get_db()
    c = conn.cursor()
    query = "SELECT * FROM medicines WHERE 1=1"
    params = []
    if search:
        query += " AND (medicine_name LIKE ? OR generic_name LIKE ? OR batch_no LIKE ?)"
        params += [f"%{search}%", f"%{search}%", f"%{search}%"]
    if status:
        query += " AND status = ?"
        params.append(status)
    if category:
        query += " AND category = ?"
        params.append(category)
    c.execute(query + f" LIMIT {limit} OFFSET {(page-1)*limit}", params)
    rows = c.fetchall()
    c.execute("SELECT COUNT(*) as cnt FROM medicines WHERE 1=1" + (query.split("WHERE 1=1")[1].split("LIMIT")[0] if params else ""), params)
    total = c.fetchone()["cnt"]
    conn.close()
    return {"medicines": [dict(r) for r in rows], "total": total, "page": page, "limit": limit}

@app.post("/api/inventory/medicines", status_code=201)
def add_medicine(medicine: MedicineCreate):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO medicines (medicine_name, generic_name, category, batch_no, expiry_date, quantity, cost_price, mrp, supplier, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (medicine.medicine_name, medicine.generic_name, medicine.category, medicine.batch_no,
          medicine.expiry_date, medicine.quantity, medicine.cost_price, medicine.mrp, medicine.supplier, medicine.status))
    conn.commit()
    med_id = c.lastrowid
    c.execute("SELECT * FROM medicines WHERE id = ?", (med_id,))
    row = c.fetchone()
    conn.close()
    return dict(row)

@app.put("/api/inventory/medicines/{medicine_id}")
def update_medicine(medicine_id: int, medicine: MedicineUpdate):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM medicines WHERE id = ?", (medicine_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")

    updates = {k: v for k, v in medicine.dict().items() if v is not None}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [medicine_id]
    c.execute(f"UPDATE medicines SET {set_clause} WHERE id = ?", values)
    conn.commit()
    c.execute("SELECT * FROM medicines WHERE id = ?", (medicine_id,))
    row = c.fetchone()
    conn.close()
    return dict(row)

@app.patch("/api/inventory/medicines/{medicine_id}/status")
def update_medicine_status(medicine_id: int, status: str = Query(...)):
    valid = ["Active", "Low Stock", "Expired", "Out of Stock"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE medicines SET status = ? WHERE id = ?", (status, medicine_id))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")
    conn.commit()
    conn.close()
    return {"id": medicine_id, "status": status}

@app.delete("/api/inventory/medicines/{medicine_id}")
def delete_medicine(medicine_id: int):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM medicines WHERE id = ?", (medicine_id,))
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")
    conn.commit()
    conn.close()
    return {"message": "Medicine deleted successfully"}

@app.get("/")
def root():
    return {"message": "SwasthiQ Pharmacy API is running", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))