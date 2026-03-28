# TexHub 2.0 - Frontend

Modern tailoring platform frontend built with React and Vite. This application provides a seamless experience for customers to place orders, track progress, and communicate with tailors.

## 🚀 Features

- **Customer Dashboard**: Overview of orders, recent activity, and quick actions.
- **Tailor Dashboard**: Manage pending quotations, active orders, and revenue tracking.
- **Order Management**: Step-by-step order placement with size selection and image uploads.
- **Real-time Chat**: Direct communication between customers and tailors.
- **Responsive Design**: Fully optimized for mobile and desktop using Tailwind CSS.
- **Interactive Charts**: Visual representation of orders and revenue using Recharts.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks & Context API
- **Networking**: [Axios](https://axios-http.com/)
- **Real-time**: [Socket.io-client](https://socket.io/docs/v4/client-api/)

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SritharanSri/TexHub2.0_Frontend.git
   cd TexHub2.0_Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your backend URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📄 License
This project is for demonstration/internal purposes. All rights reserved.
