# DrChrono MCP Server Overview

## What is the DrChrono MCP Server?

The DrChrono MCP Server is a connector within the Vanij Platform that enables secure and scalable integration with the DrChrono Electronic Health Record (EHR) system via the DrChrono RESTful API. It allows access to medical records, appointments, patients, prescriptions, and billing data in real-time.

---

## ✅ Key Features

- Fetch and update patient records and demographics  
- Retrieve appointments, schedule slots, and encounter notes  
- Manage prescriptions, lab orders, and documents  
- Access billing data, insurance, and clinical forms  
- OAuth 2.0-based authentication for secure access  
- Built-in pagination, rate-limiting, and retry handling  

---

## 🧩 Capabilities

| Capability              | Description                                                    |
|------------------------|----------------------------------------------------------------|
| Patient Management      | Get, create, and update patient demographics and charts        |
| Appointment Handling    | List, create, or cancel appointments and access visit details  |
| Clinical Data Access    | Retrieve vitals, notes, diagnoses, medications, and allergies  |
| Prescription Support    | Manage prescriptions and pharmacy orders                      |
| Billing & Insurance     | Access insurance, charges, CPT/ICD codes, and payments        |
| Document Handling       | Upload and manage patient documents and attachments           |

---

## 📦 Supported DrChrono API Version

- DrChrono API v2018.01.01  
- Fully compatible with both production and sandbox environments  

---

## 🔐 Security Notes

- OAuth 2.0 is required for user and system-level access  
- Requires specific scopes (e.g., `patients`, `appointments`, `clinical`, `billing`)  
- All requests must be made over HTTPS  
- Supports secure token rotation and refresh  

---

## 🔄 Integration Use Cases

- Syncing patient data into CRMs, analytics platforms, or data lakes  
- Automated appointment reminders and calendar syncs  
- Medical billing reconciliation with finance systems  
- EHR data integration into custom health apps  
- Real-time clinical dashboards and reporting tools  
