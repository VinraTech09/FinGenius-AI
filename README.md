# FinGenius AI - Complete Project Summary

## 📱 What is FinGenius AI?
FinGenius AI is an **AI-Powered Fintech Web Application** - a full-stack application that helps users manage finances using artificial intelligence. It tracks income/expenses, provides financial insights, and predicts future financial health.

---

## 🗂️ Project File Structure

```
FinGenius Ai/
├── backend/                    (Server-side code)
│   ├── server.js              (Main server file)
│   ├── package.json           (Node.js dependencies)
│   │
│   ├── ai/                    (AI/ML Engines)
│   │   ├── healthScoreEngine.js    - Calculates financial health score
│   │   ├── fraudEngine.js          - Detects fraud/suspicious transactions
│   │   └── predictionModel.js      - Predicts future balance (TensorFlow.js)
│   │
│   ├── controllers/           (Request handlers)
│   │   ├── userController.js       - User registration/login
│   │   ├── financeController.js    - Income/expense management
│   │   └── aiController.js         - AI features
│   │
│   ├── middleware/            (Security)
│   │   └── auth.js                 - JWT authentication
│   │
│   ├── models/                (Database schemas)
│   │   ├── User.js                 - User data structure
│   │   └── Transaction.js          - Transaction data structure
│   │
│   └── routes/                (API endpoints)
│       ├── userRoutes.js          - User API routes
│       ├── financeRoutes.js       - Finance API routes
│       └── aiRoutes.js            - AI API routes
│
└── frontend/                   (User Interface)
    ├── index.html             (Login/Register page)
    ├── dashboard.html         (Main dashboard)
    ├── transactions.html      (Transaction history)
    ├── chatbot.html           (AI Chatbot)
    ├── profile.html           (User profile)
    ├── subscription.html      (Subscription plans)
    ├── about.html             (About page)
    ├── contact.html           (Contact page)
    ├── help.html              (Help page)
    ├── faq.html               (FAQ)
    ├── privacy.html           (Privacy policy)
    ├── terms.html             (Terms of service)
    │
    ├── css/
    │   └── style.css          (Styling - Glassmorphism dark theme)
    │
    └── js/
        ├── app.js             (Main app logic)
        ├── dashboard.js       (Dashboard functionality)
        └── ai.js              (AI features on frontend)
```

---

## 🛠️ Languages Used

| Layer | Language | Purpose |
|-------|----------|---------|
| Backend | **JavaScript (Node.js)** | Server logic, API handling |
| Frontend | **HTML5** | Page structure |
| Frontend | **CSS3** | Styling (Glassmorphism theme) |
| Frontend | **JavaScript** | Client-side logic, API calls |

---

## 🔧 Tools & Technologies

### Backend Tools:
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for APIs
- **Mysql** - Database
- **JWT** - Secure authentication
- **bcryptjs** - Password encryption
- **TensorFlow.js** - AI/ML predictions

### Frontend Tools:
- **Axios** - API requests
- **Chart.js** - Financial charts/graphs
- **Glassmorphism CSS** - Modern dark theme UI

---

## 🤖 AI Features

1. **Financial Health Score** - Scores your financial health (0-100) based on savings, expenses, income
2. **Purchase Suggestions** - AI tells you if you can afford a purchase
3. **Fraud Detection** - Flags suspicious transactions
4. **Balance Predictions** - Predicts future balance using TensorFlow.js
5. **AI Chatbot** - Chat with AI about finances

---

## 👥 Team

- **Dhananjay Wadghane** - CEO & Founder
- **Harshada Bolekar** - UI/UX Designer
- **Vinita Tarayil** - Advisor

---

## ✅ Current Status

The backend server is **running** at:
- **Port:** 5000
- **URL:** http://localhost:5000/api

The frontend can be opened directly in browser from: `FinGenius Ai/frontend/index.html`

---

## 🚀 How to Run

### Backend:
```
bash
cd "FinGenius Ai/backend"
npm install
npm start
```

### Frontend:
Open `FinGenius Ai/frontend/index.html` in your browser

Or using Python:
```
bash
cd "FinGenius Ai/frontend"
python -m http.server 8000
```
Then open http://localhost:8000
