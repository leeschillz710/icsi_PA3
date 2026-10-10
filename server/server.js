const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();
const PORT = 9000;

app.use(cors());            // allow frontend to communicate with backend
app.use(express.json());    // parse JSON request bodies

// connect MongoDB using URI from .env
const client = new MongoClient(process.env.MONGO_URI);

let users;  // will hold the MongoDb "users" collection

// ---------- SIGNUP ROUTE --------------
app.post("/signup", async (req, res) => {
    const {
        f_name,
        l_name,
        username,
        password
    } = req.body;
    // validate required fields
    if (
        !f_name?.trim() ||
        !l_name?.trim() ||
        !username?.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const cleanUsername = username.trim();

        // check if username already exists
        const existingUser = await users.findOne({
            username: cleanUsername
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        // hash password before storing
        const passwordHash = await bcrypt.hash(password, 10);

        // insert new user into the database
        await users.insertOne({
            f_name: f_name.trim(),
            l_name: l_name.trim(),
            username: cleanUsername,
            password: passwordHash
        });

        return res.status(201).json({
            message: "User created successfully."
        });
    } catch (error) {
        console.error("Signup error:", error);

        // handle duplicate username error from MongoDB
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        return res.status(500).json({
            message: "Server error."
        });
    }
});

// ---------- LOGIN ROUTE --------------
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // validate required fields
    if (!username?.trim() || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    try {
        // look up user by username
        const user = await users.findOne({
            username: username.trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        // compare provided password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        return res.status(200).json({
            message: "Login successful."
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
});

// ---------- SERVER STARTUP ---------
async function startServer() {
    try {
        await client.connect(); // connect to MongoDB

        const db = client.db("pa2");
        users = db.collection("users");

        // ensure usernames are unique
        await users.createIndex(
            { username: 1 },
            { unique: true }
        );

        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();