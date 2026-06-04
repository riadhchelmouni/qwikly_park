# Qwikly Park

Qwikly Park is a comprehensive ERP / System Management platform specifically designed for Park Management. 
This project uses a **Monorepo** architecture, separating the backend API from the frontend Single Page Application (SPA), while keeping them in a single, easy-to-manage repository.

## Architecture Overview

- **Backend (`qwikly_park_api/`)**: Built with Laravel 10. Serves as a RESTful API and uses Laravel Sanctum for SPA authentication.
- **Frontend (`qwikly_park_frontend/`)**: Built with Vue 3 (Composition API) + Vite. Uses Pinia for state management and Vuetify 3 for UI components.

For more details on the project's future plans and architecture, please see the [ROADMAP.md](./ROADMAP.md).

## Prerequisites

Before you begin, ensure you have the following installed:
- **PHP** >= 8.1
- **Composer**
- **Node.js** >= 18
- **pnpm** (Package manager for the frontend)
- **MySQL** (or any preferred database server like XAMPP / Laragon)

## Installation & Setup

Clone the repository to your local machine:
```bash
git clone https://github.com/riadhchelmouni/qwikly_park.git
cd qwikly_park
```

### 1. Backend Setup (Laravel API)
```bash
cd qwikly_park_api

# Install PHP dependencies
composer install

# Set up environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```
*Note: Make sure to update your `.env` file with your local database credentials (e.g., `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`).*

Run the migrations to create the database tables:
```bash
php artisan migrate
```

Start the API server:
```bash
php artisan serve
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup (Vue 3 SPA)
Open a **new terminal** window and navigate to the frontend directory:
```bash
cd qwikly_park_frontend

# Install JavaScript dependencies
pnpm install

# Start the development server
pnpm dev
```
The frontend will be available at `http://localhost:5173`.

## Contributing
Feel free to open issues or submit pull requests. Ensure that you follow the established architectural guidelines (e.g., Service Pattern in Laravel, Composition API in Vue).

## License
[MIT License](LICENSE)
