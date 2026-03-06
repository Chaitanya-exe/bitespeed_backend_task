# Bitespeed Backend Task – Identity Reconciliation

This project implements an identity reconciliation service that links multiple contact records belonging to the same user based on shared email addresses and phone numbers.

The system maintains a **primary contact** for each identity cluster and attaches other related contacts as **secondary contacts**.

---

## Live Deployment

The service is deployed and accessible at:

https://bitespeed-backend-task-mjgx.onrender.com

---

## Endpoint

### Identify Contact

**POST**

```
/identify
```

### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

At least one of `email` or `phoneNumber` must be provided.

---

### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "example@email.com"
    ],
    "phoneNumbers": [
      "1234567890"
    ],
    "secondaryContactIds": [
      2,
      3
    ]
  }
}
```

---

## Identity Resolution Logic

When a request is received:

1. The system searches for existing contacts matching the provided email or phone number.
2. If no matching contact exists:
   - A new **primary contact** is created.
3. If matches exist:
   - All related contacts are grouped into an **identity cluster**.
4. If multiple clusters are discovered:
   - They are merged.
   - The **oldest primary contact remains the primary**.
   - Other primaries become **secondary contacts**.
5. If the request introduces new information (new email or phone):
   - A new **secondary contact** is created and linked to the primary.

This ensures that all identities connected through shared information resolve to a single primary identity.

---

## Tech Stack

- **Node.js**
- **NestJS**
- **TypeORM**
- **SQLite**

---

## Project Setup

Below is a project setup if you would like to test this locally, although this project is hosted on this [https://bitespeed-backend-task-mjgx.onrender.com](https://bitespeed-backend-task-mjgx.onrender.com)
### Install dependencies

```
npm install
```

### Start the server

```
npm run start:dev
```

Server runs on:

```
http://localhost:5000
```

---

## Example Request

```
POST /identify
```

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

---

## Database

The project uses **SQLite** with TypeORM.  
The database file is automatically created when the server starts.

---

## Additional Notes

- Contact identities are linked through shared **email or phone numbers**.
- The **oldest primary contact always remains the primary** during merges.
- Secondary contacts maintain historical links within the identity cluster.
- If you want to test with dummy data on the hosted URL please send a POST request on /seed route to seed a sample database.


## Hosting information
---