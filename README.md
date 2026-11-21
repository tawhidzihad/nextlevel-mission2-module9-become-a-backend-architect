# Express.js Middleware, Role-Based Access & Refresh Token Authentication API

A backend practice project built with **Express.js 5**, **TypeScript** and **PostgreSQL**. It extends the modular authentication API from the previous module with **custom middleware** (logger, auth, global error handler), **role-based authorization**, **refresh tokens stored in HTTP-only cookies**, **CORS** and a reusable **response helper**.

This project is part of **Programming Hero — Next Level Development, Mission 2, Module 9: Become a Backend Architect**.

In the last module I built login with a single JWT access token. In this module I learned how real-world APIs protect routes: who is allowed to call an endpoint, how tokens are renewed without logging in again, and how middleware runs between a request and its controller.

> **Learning focus:** Express middleware, request logging, JWT access & refresh tokens, cookies, role-based authorization, CORS, global error handling and a consistent response format.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Backend Framework:** Express.js 5
- **Database:** PostgreSQL
- **PostgreSQL Client:** `pg` (node-postgres)
- **Password Hashing:** `bcryptjs`
- **Authentication:** `jsonwebtoken` (access token + refresh token)
- **Cookies:** `cookie-parser`
- **CORS:** `cors`
- **Environment Variables:** dotenv
- **Development:** TSX (watch mode)

## What I Practiced

- Writing **custom middleware** and understanding how `next()` passes control through the request pipeline.
- Building a **logger middleware** that appends every request (method, URL, time) to `logger.txt`.
- Building an **auth middleware** that verifies the JWT, checks that the user exists and is active, and checks the user's role.
- Implementing **role-based access control** with `admin`, `agent` and `user` roles.
- Creating a **role type and constants** (`Role`, `USER_ROLE`) in a shared `types` folder.
- Extending Express's `Request` type so `req.user` is available with TypeScript.
- Generating a **short-lived access token** (1 hour) and a **long-lived refresh token** (10 days).
- Storing the refresh token in a cookie with `httpOnly`, `sameSite` and `secure` options.
- Building a **refresh-token endpoint** that issues a new access token.
- Configuring **CORS** for a specific frontend origin.
- Adding a **global error handling middleware**.
- Creating a reusable **`sendResponse`** utility for consistent API responses.

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── index.ts                  # PORT, DATABASE_URI, JWT secrets
│   ├── db/
│   │   └── index.ts                  # PostgreSQL pool + table creation (initDB)
│   ├── middleware/
│   │   ├── auth.ts                   # JWT verification + role-based authorization
│   │   ├── globalErrorHandler.ts     # Global error handling middleware
│   │   ├── logger.ts                 # Request logger (writes to logger.txt)
│   │   └── index.d.ts                # Adds `user` to Express Request type
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.controller.ts    # Login + refresh token cookie
│   │   │   └── auth.service.ts       # Login + generate access token
│   │   ├── user/
│   │   │   ├── user.route.ts         # Routes protected by auth(...roles)
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.interface.ts
│   │   └── profile/
│   │       ├── profile.route.ts
│   │       ├── profile.controller.ts
│   │       └── profile.service.ts
│   ├── types/
│   │   └── index.ts                  # Role type + USER_ROLE constants
│   ├── utils/
│   │   └── sendResponse.ts           # Reusable response helper
│   ├── app.ts                        # Express app, middlewares and routes
│   └── server.ts                     # Entry point
├── .gitignore
├── logger.txt                        # Generated request logs
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Middleware Pipeline

Middlewares are registered in `app.ts` and run in this order for every request:

```
cors → cookie-parser → express.json / text / urlencoded → logger → routes → globalErrorHandler
```

| Middleware            | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `cors`                | Allows requests from the configured frontend origin (`localhost:3000`) |
| `cookie-parser`       | Reads cookies so the refresh token is available as `req.cookies`       |
| `express.json()` etc. | Parses JSON, text and form bodies                                      |
| `logger`              | Appends `Method / URL / Time` of each request to `logger.txt`          |
| `auth(...roles)`      | Protects routes by verifying the token and checking the user's role    |
| `globalErrorHandler`  | Catches errors passed with `next(error)` and returns a JSON error      |

## Authentication & Authorization

### Tokens

| Token             | Secret               | Expiry  | Where it lives                         |
| ----------------- | -------------------- | ------- | -------------------------------------- |
| **Access token**  | `JWT_SECRET`         | 1 hour  | Returned in the response body          |
| **Refresh token** | `REFRESH_JWT_SECRET` | 10 days | `httpOnly` cookie named `refreshToken` |

The JWT payload contains the user's `id`, `name`, `email` and `role`.

### Login flow

1. Find the user by `email`.
2. Compare the password with the stored hash using `bcrypt.compare`.
3. Check that the user is active (`is_active`).
4. Generate an access token and a refresh token.
5. Save the refresh token in an `httpOnly` cookie and return `{ accessToken, refreshToken, user }` without the password.

### Refresh token flow

1. The client calls `POST /api/v1/auth/refresh-token` (the browser sends the cookie).
2. The server verifies the refresh token with `REFRESH_JWT_SECRET`.
3. It checks that the user still exists and is active.
4. It returns a brand-new access token.

### Auth middleware flow

`auth(...roles)` is a middleware factory. Example: `auth("admin", "agent")`.

1. Read the token from the `Authorization` header — no token → `401`.
2. Verify the token with `JWT_SECRET`.
3. Check that the user exists in the database — otherwise `404`.
4. Check that the user is active — otherwise `403`.
5. Check that the user's role is one of the allowed roles — otherwise `401`.
6. Attach the decoded token to `req.user` and call `next()`.

### Cookie options used

| Option     | Value   | Why                                                                        |
| ---------- | ------- | -------------------------------------------------------------------------- |
| `httpOnly` | `true`  | JavaScript in the browser cannot read the cookie (helps against XSS)       |
| `sameSite` | `"lax"` | Limits cross-site sending of the cookie (helps against CSRF)               |
| `secure`   | `false` | `false` for HTTP in development, should be `true` with HTTPS in production |
| `path`     | `"/"`   | Cookie is sent for all routes                                              |

## Database Tables

Tables are created automatically on server start (`CREATE TABLE IF NOT EXISTS`).

### `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    age INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_Active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

New in this module: the `role` column (`admin`, `agent` or `user`, default `user`).

### `profile`

```sql
CREATE TABLE IF NOT EXISTS profile(
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    address TEXT,
    phone VARCHAR(15),
    gender VARCHAR(15),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

`users` and `profile` have a **one-to-one** relationship (`user_id` is `UNIQUE`), and deleting a user also deletes the profile (`ON DELETE CASCADE`).

## API Endpoints

Base URL: `http://localhost:5000`

| Method   | Endpoint                     | Access                     | Description                                               |
| -------- | ---------------------------- | -------------------------- | --------------------------------------------------------- |
| `GET`    | `/`                          | Public                     | Server status response                                    |
| `POST`   | `/api/v1/auth/login`         | Public                     | Login, returns access token and sets refresh token cookie |
| `POST`   | `/api/v1/auth/refresh-token` | Refresh token cookie       | Returns a new access token                                |
| `POST`   | `/api/v1/users`              | Public                     | Creates a user (password is hashed)                       |
| `GET`    | `/api/v1/users`              | `admin`, `agent`           | Retrieves all users                                       |
| `GET`    | `/api/v1/users/:id`          | `admin`, `agent`, `user`   | Retrieves one user by ID                                  |
| `PUT`    | `/api/v1/users/:id`          | `admin`, `user`            | Updates name, age, password or active status              |
| `DELETE` | `/api/v1/users/:id`          | Public (not protected yet) | Deletes a user by ID                                      |
| `POST`   | `/api/v1/profiles`           | Public (not protected yet) | Creates a profile for an existing user                    |

### Sending the access token

Protected routes read the token from the `Authorization` header:

```
Authorization: <accessToken>
```

### Response Format

All responses are sent through the `sendResponse` helper:

```json
{
	"success": true,
	"messages": "Users retrived successfully!",
	"data": []
}
```

On failure:

```json
{
	"success": false,
	"messages": "Unauthorized access!!"
}
```

### Login

**POST** `/api/v1/auth/login`

```json
{
	"email": "tawhid@example.com",
	"password": "your-password"
}
```

The response contains the `accessToken`, the `refreshToken` and the `user` (without password). The refresh token is also set as an `httpOnly` cookie.

### Refresh Access Token

**POST** `/api/v1/auth/refresh-token`

No body is needed. The `refreshToken` cookie is sent automatically by the browser (or by your API client's cookie jar).

```json
{
	"success": true,
	"messages": "Access token generated successfully",
	"data": {
		"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

### Create a User

**POST** `/api/v1/users`

```json
{
	"name": "Tawhid",
	"age": 22,
	"email": "tawhid@example.com",
	"password": "your-password",
	"role": "user"
}
```

If `role` is omitted, it defaults to `user`.

### Update a User

**PUT** `/api/v1/users/:id`

```json
{
	"name": "Updated Name",
	"age": 23,
	"is_Active": true
}
```

### Create a Profile

**POST** `/api/v1/profiles`

```json
{
	"user_id": 1,
	"bio": "MERN stack developer learning backend engineering.",
	"address": "Dhaka, Bangladesh",
	"phone": "01700000000",
	"gender": "male"
}
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tawhidzihad/nextlevel-mission2-module9-become-a-backend-architect.git
```

### 2. Go to the project directory

```bash
cd nextlevel-mission2-module9-become-a-backend-architect
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URI=your_postgresql_connection_string
JWT_SECRET=your_access_token_secret
REFRESH_JWT_SECRET=your_refresh_token_secret
```

- `JWT_SECRET` and `REFRESH_JWT_SECRET` should be two different, long, random strings.

> Never commit your `.env` file. It is already listed in `.gitignore`.

### 5. Start the development server

```bash
npm run dev
```

The API will be available at:

```
http://localhost:5000
```

## What I Learned

- How middleware works in Express and how `next()` moves a request through the pipeline.
- How to write a middleware factory (`auth(...roles)`) that accepts parameters.
- The difference between **authentication** (who are you?) and **authorization** (what can you do?).
- Why access tokens are short-lived and how refresh tokens keep users logged in safely.
- How `httpOnly`, `sameSite` and `secure` cookie options help protect tokens.
- How to implement role-based access control using a role column and shared role constants.
- How to extend Express types in TypeScript to add `req.user`.
- How CORS works and how to allow a specific frontend origin.
- How a global error handler and a `sendResponse` helper keep the API consistent.

## Future Improvements

- Protect `DELETE /api/v1/users/:id` and `POST /api/v1/profiles` with the auth middleware.
- Do not allow public sign-up to choose its own `role` (e.g. force `user` unless an admin creates it).
- Add ownership checks so a `user` can only read or update their own data.
- Support the standard `Authorization: Bearer <token>` format.
- Return `401` for expired or invalid tokens instead of a generic `500`.
- Hash the password when updating a user, and hide the `password` field in "get users" responses.
- Add request validation (e.g. with Zod).
- Move CORS origin, cookie `secure` / `domain` settings into environment variables for production.
- Add `logger.txt` to `.gitignore` or use a logging library.
- Add endpoints to read, update and delete profiles, plus pagination and filtering.

## Author

**Tawhid Zihad**

MERN Stack Developer | Learning Backend Engineering

- GitHub: [@tawhidzihad](https://github.com/tawhidzihad)

---

⭐ This repository documents my journey from a basic authenticated API to a role-based, middleware-driven backend with refresh tokens.
