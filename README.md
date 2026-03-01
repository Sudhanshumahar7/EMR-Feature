# SwasthiQ Pharmacy CRM

A simplified Pharmacy Module with Dashboard and Inventory management built with **FastAPI** (Python) backend and **React** frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI |
| Database | SQLite |
| Frontend | React 18, functional components + hooks |
| Styling | Pure CSS with CSS variables |

---

## Project Structure

```
EMR-feature/
├── backend/
│    ├── _pycache_./
│    ├── venv/
│    ├── main.py          # FastAPI app with all endpoints
│    ├── requirements.txt
│    └── pharmacy.db      # Auto-created SQLite database
├── frontend/
│    ├── public/
│    ├── src/
│    │   ├── api/index.js       # All API calls
│    │   ├── components/
│    │   │   ├── Sidebar.js
│    │   │   └── StatCard.js
│    │   ├── pages/
│    │   │   ├── Dashboard.js
│    │   │   └── Inventory.js
│    │   ├── App.js
│    │   ├── App.css
│    │   ├── index.css
│    │   └── index.js
│    ├── .gitignore
│    ├── package-lock.json
│    └── package.json
└── README.md

```

---

## Setup & Run

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm start
```

App runs at: http://localhost:3000

---

## REST API Contracts

### Dashboard Endpoints

#### `GET /api/dashboard/sales-summary`
Returns today's total sales amount and growth.
```json
{
  "today_sales": 1523.75,
  "transaction_count": 5,
  "growth_percent": 12.5
}
```

#### `GET /api/dashboard/items-sold`
Returns total items sold today.
```json
{ "items_sold_today": 156 }
```

#### `GET /api/dashboard/low-stock`
Count of medicines that are Low Stock or Out of Stock.
```json
{ "low_stock_count": 12 }
```

#### `GET /api/dashboard/purchase-orders`
Pending purchase orders summary.
```json
{ "total_value": 96250, "pending_count": 5 }
```

#### `GET /api/dashboard/recent-sales?limit=10`
Recent sales list.
```json
[
  {
    "id": 1,
    "invoice_no": "INV-2024-1234",
    "patient_name": "Rajesh Kumar",
    "items_count": 3,
    "total_amount": 340,
    "payment_mode": "Card",
    "status": "Completed",
    "sale_date": "2024-11-20"
  }
]
```

---

### Inventory Endpoints

#### `GET /api/inventory/overview`
```json
{ "total_items": 10, "active_stock": 5, "low_stock": 3, "total_value": 153034 }
```

#### `GET /api/inventory/medicines`
Query params: `search`, `status`, `category`, `page`, `limit`
```json
{
  "medicines": [...],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

#### `POST /api/inventory/medicines` → 201 Created
Request body:
```json
{
  "medicine_name": "Paracetamol 650mg",
  "generic_name": "Acetaminophen",
  "category": "Analgesic",
  "batch_no": "PCM-2024-0892",
  "expiry_date": "2026-08-20",
  "quantity": 500,
  "cost_price": 15.00,
  "mrp": 25.00,
  "supplier": "MedSupply Co.",
  "status": "Active"
}
```

#### `PUT /api/inventory/medicines/{id}`
Partial or full update. Same fields as POST. Returns updated medicine.

#### `PATCH /api/inventory/medicines/{id}/status?status=Expired`
Valid values: `Active`, `Low Stock`, `Expired`, `Out of Stock`

#### `DELETE /api/inventory/medicines/{id}` → 200 OK
```json
{ "message": "Medicine deleted successfully" }
```

---

## Data Consistency on Updates

The `updateMedicine` endpoint ensures data consistency through:

1. **Existence check** — Verifies the medicine exists before attempting update; returns 404 if not found.
2. **Partial updates** — Only fields explicitly provided in the request body are updated; others remain unchanged. This prevents accidental overwriting of unrelated fields.
3. **Type validation** — Pydantic models enforce correct types (floats for prices, int for quantity) at the API boundary before touching the database.
4. **Atomic transactions** — SQLite operations use `conn.commit()` only after successful execution, rolling back on failure.
5. **Post-update read** — After every update, the endpoint fetches and returns the current state of the record, ensuring the client always receives the true persisted state.

---

## Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Resource not found |
| 422 | Unprocessable Entity (Pydantic validation) |
| 500 | Internal Server Error |
