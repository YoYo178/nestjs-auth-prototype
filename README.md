<p align="center" style="font-size: 32px; font-weight: 600">This project is powered by</p>
<p align="center">
  <a href="https://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
A clean, modular Nest.js prototype built to learn & practice real backend concepts the right way.
</p>

---

## 🚀 Description

This project started as a small practice exercise and turned into a full mini-authentication system.

The goal was to understand and implement:

- **Nest.js** (modules, services, guards, interceptors, DI)
- **Prisma ORM**
- **PostgreSQL**
- **Session-based authentication**
- **Redis session storage**
- **Rate limiting via Nest's ThrottlerModule**
- **Logging & caching interceptors**
- **Multi-session support (per-device login/logout)**

…and all of that has been successfully implemented.

> [!NOTE]
> This is **not** meant to be a production app.
> but rather a learning-focused prototype that demonstrates backend architecture and clean NestJS patterns.

---

## ✨ Features

- Signup / Signin / Signout endpoints  
- Http-only cookie sessions
- Redis-backed session storage
- Multi-session login support (login from multiple devices)
- Session management routes:
  - List active sessions  
  - Logout specific session  
  - Logout all sessions  
- `/users/me` route with authentication guard  
- Per-route rate limiting  
- Request logging interceptor  
- Simple caching interceptor for `/users/me`  
- Proper module separation (Auth, Users, Sessions, Redis, Prisma…)

---

## 🛠️ Tech Stack

- **Nest.js** (framework)
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Redis**
- **PNPM**

---

## 📦 Project Setup

```bash
pnpm install
```

---

## ▶️ Running the Project

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

---

## 🧪 Tests

```bash
$ pnpm run test
bash: /usr/bin/test-runner: line 1: tests: author has skill issue and does not write tests (yet)
```

## 📜 License

This project is [MIT licensed](LICENSE).
