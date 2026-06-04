# Qwikly Park - Project Roadmap & Overview

Welcome to the **Qwikly Park** repository! 🚀
This project is an integrated ERP / System Management platform designed for managing Parks. The architecture is built using a **Monorepo** approach, meaning the Frontend and Backend are completely separated but live within the same repository to streamline development.

---

## Architecture

The project is divided into two main directories:

### 1. `qwikly_park_api` (Backend)

- **Technology:** Laravel 10 (PHP)
- **Role:** Acts as a pure RESTful API. It handles incoming requests, manages the database (MySQL), and handles authentication using `Laravel Sanctum`.
- **Key Features:**
  - Implementation of the Service Pattern to decouple business logic from Controllers (e.g., `OrderService`, `CheckoutService`).
  - Utilization of Polymorphic Relations within the database.

### 2. `qwikly_park_frontend` (Frontend)

- **Technology:** Vue 3 (Composition API) + Vite
- **Role:** A Single Page Application (SPA) that interacts with the API to display data and handle user interactions.
- **Core Libraries:**
  - **Vuetify 3:** For professional, ready-to-use UI components.
  - **Pinia:** For State Management.
  - **Vue Router:** For handling navigation between pages.

---

## Local Development Guide

Since the project is decoupled, you will need to run two separate environments:

### Step 1: Running the API

1. Ensure your database server (e.g., XAMPP, Laragon) is running.
2. Open a Terminal inside the `qwikly_park_api` directory.
3. Start the server:
   ```bash
   php artisan serve
   ```

### Step 2: Running the Frontend

1. Open a new Terminal inside the `qwikly_park_frontend` directory.
2. Install the packages (first time only):
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

---

## Roadmap & Next Steps

This is a list of planned goals and future improvements for the project:

### Current Phase (Completed)

- [x] Completely decouple the Frontend and Backend to increase performance and facilitate deployments.
- [x] Remove complex Docker/Sail configurations to simplify local development.
- [x] Merge both projects into a single Git Monorepo.

### Upcoming Phase (In Development / Refactoring)

- [ ] **Refactor Complex Vue Pages:** Break down massive components (like `fidelite.vue` and `paramétrage-financier.vue`) into smaller, independent components according to global best practices.
- [ ] **Improve Error Handling:** Create a unified Service in the frontend to handle API errors smoothly.

### Future Goals

- [ ] Prepare the project for automated deployment (CI/CD Pipeline) using GitHub Actions.
- [ ] Host the API on a VPS and host the Frontend on a platform like Vercel or Netlify.
- [ ] Add automated testing (Unit Tests & Feature Tests) to ensure system stability.
