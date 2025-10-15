# BudgetIt App

## Overview
The BudgetIt is a web application designed to help users manage their budgets and track transactions efficiently. It provides a user-friendly interface for authentication, budget creation, and transaction management.

## Features
- User authentication (registration and login)
- Budget management (create, update, delete budgets)
- Transaction handling (add, update, retrieve transactions)
- Responsive design for both desktop and mobile devices

## Project Structure
```
budget-it-app
├── backend
│   ├── server.js
│   ├── routes
│   ├── controllers
│   ├── models
│   ├── middleware
│   └── utils
├── frontend
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── css
│   ├── js
│   ├── components
│   └── data
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js
- npm (Node Package Manager)

### Backend Setup
1. Navigate to the `backend` directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   node server.js
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```
   cd frontend
   ```
2. Open `index.html` in your web browser to access the application.

## Usage
- Users can register for a new account or log in to an existing account.
- Once logged in, users can create budgets and manage transactions through the dashboard.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.