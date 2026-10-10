# icsi418-PA2

Project Overview: 
-----------------------------------------------------------------------
This is a simple full-stack implementaion of user Signup and Login functionallity using
    - React (frontend)
    - Express.js (backend)
    - MongoDB (database)
    - bcryptjs for password hashing

It demonstrates how a client-side form sends data to a server, how the server validates and process that data, and how user accounts are stored securely in a database.



Features:
------------------------------------------------------------------------------
- Create a new user account (Signup)
- Log in with an existing account
- Password hashing for security
- Duplicate username protection
- Clear success/error messages in the UI
- MongoDB storage with a unique index on usernames



Project Structure: 
-------------------------------------------------------------------------------
project/
│
├── backend/
│   └── server.js        # Express server + MongoDB connection
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Renders Signup + Login components
│   │   └── components/
│   │       ├── Signup.jsx
│   │       └── Login.jsx
│   └── package.json
│
└── README.md






How it works:
--------------------------------------------------------------------------
React Frontend:
- The interface is split into 2 components: Signup and Login

- Each component uses React's useState hook to store form input values and feedback messages.

- When the user submits a form, the component sends a POST request to the Express backend using the Fetch API

- The server's response message is displayed directly in the UI
_______________________________________________________________________

Express Backend:
- The backend exposes 2 routes:
    - POST /signup
    - POST /login

- Incoming JSON data is validated

- Passwords are hashed using bcryptjs before being stored.

- Login requests compare the provided password with the stored hash.

- Responses are sent back to the frontend as JSON.
 ________________________________________________________________________

MongoDB Integration:
- The bakcend connects to MongoDB using MongoClient

- User accounts are stored in a users collection

- A unique index is created on the username field to prevent duplicates.

- Signup inserts a new user document; Login retrieves and verifies an existing one.
________________________________________________________________________________





Set up:
-------------------------------------------------------------------------
1. Clone the Repository

2. Backend Setup:
- Create a .env file
- start the server
- the backend runs at: http://localhost:9000

3. Frontend Setup
cd frontend
npm install
npm start
- The React app runs at: http://localhost:3000




Usage:
---------------------------------------------------------------------------
1. Open the frontend in your brownser
2. Use the Signup form to create a new account.
3. Use the Login form to authenticate with the same credentials 
4. Messages will appear below each indicating success or errors




Technology Used:
---------------------------------------------------------------------------
- React
- JavaScript (ES6+)
- Express.js
- Node.js
- MongoDB
- bcryptjs
- CORS



Future Improvements:
-----------------------------------------------------------------------------
- Add JWT authentication
- Add protected routes
- Add session persistence
- Add form validation on both front and backend
- Improve UI styling