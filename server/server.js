const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let users;
let projects;
let projectMemberships;

const allowedStatuses = ["Planning", "Active", "Completed"];

function validId(id) {
    return typeof id === "string" && ObjectId.isValid(id);
}

// ---------- SIGNUP ROUTE ----------

app.post("/signup", async (req, res) => {
    const { f_name, l_name, username, password } = req.body;

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

        const existingUser = await users.findOne({
            username: cleanUsername
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

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

// ---------- LOGIN ROUTE ----------

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
        return res.status(400).json({
            message: "Username and password are required."
        });
    }

    try {
        const user = await users.findOne({
            username: username.trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

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

// ---------- GET REGISTERED USERS ----------

app.get("/api/users", async (_req, res) => {
    try {
        const userList = await users
            .find(
                {},
                {
                    projection: {
                        password: 0
                    }
                }
            )
            .toArray();

        return res.status(200).json(userList);
    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            message: "Could not retrieve users."
        });
    }
});

// ---------- CREATE PROJECT ----------

app.post("/api/projects", async (req, res) => {
    const {
        name,
        description,
        status,
        project_lead_id
    } = req.body;

    if (
        !name?.trim() ||
        !description?.trim() ||
        !status ||
        !project_lead_id
    ) {
        return res.status(400).json({
            message: "All project fields are required."
        });
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid project status."
        });
    }

    if (!validId(project_lead_id)) {
        return res.status(400).json({
            message: "Invalid project lead ID."
        });
    }

    try {
        const leadId = new ObjectId(project_lead_id);

        const lead = await users.findOne({
            _id: leadId
        });

        if (!lead) {
            return res.status(404).json({
                message: "Project lead was not found."
            });
        }

        const project = {
            name: name.trim(),
            description: description.trim(),
            status,
            project_lead_id: leadId
        };

        const result = await projects.insertOne(project);

        await projectMemberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        return res.status(201).json({
            message: "Project created successfully.",
            projectId: result.insertedId.toString()
        });
    } catch (error) {
        console.error("Create project error:", error);

        return res.status(500).json({
            message: "Could not create the project."
        });
    }
});

// ---------- GET ALL PROJECTS ----------

app.get("/api/projects", async (_req, res) => {
    try {
        const projectList = await projects.find({}).toArray();

        return res.status(200).json(projectList);
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            message: "Could not retrieve projects."
        });
    }
});

// ---------- GET PROJECT MEMBERSHIPS ----------

app.get("/api/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;

    if (!validId(projectId)) {
        return res.status(400).json({
            message: "Invalid project ID."
        });
    }

    try {
        const convertedProjectId = new ObjectId(projectId);

        const project = await projects.findOne({
            _id: convertedProjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project was not found."
            });
        }

        const memberships = await projectMemberships
            .find({
                project_id: convertedProjectId
            })
            .toArray();

        return res.status(200).json(memberships);
    } catch (error) {
        console.error("Get project members error:", error);

        return res.status(500).json({
            message: "Could not retrieve project members."
        });
    }
});

// ---------- ADD PROJECT MEMBER ----------

app.post("/api/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (!validId(projectId) || !validId(user_id)) {
        return res.status(400).json({
            message: "Invalid project or user ID."
        });
    }

    try {
        const convertedProjectId = new ObjectId(projectId);
        const convertedUserId = new ObjectId(user_id);

        const project = await projects.findOne({
            _id: convertedProjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project was not found."
            });
        }

        const user = await users.findOne({
            _id: convertedUserId
        });

        if (!user) {
            return res.status(404).json({
                message: "User was not found."
            });
        }

        const existingMembership =
            await projectMemberships.findOne({
                project_id: convertedProjectId,
                user_id: convertedUserId
            });

        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this project."
            });
        }

        await projectMemberships.insertOne({
            project_id: convertedProjectId,
            user_id: convertedUserId
        });

        return res.status(201).json({
            message: "Project member added successfully."
        });
    } catch (error) {
        console.error("Add project member error:", error);

        return res.status(500).json({
            message: "Could not add the project member."
        });
    }
});

// ---------- REMOVE PROJECT MEMBER ----------

app.delete(
    "/api/projects/:projectId/members/:userId",
    async (req, res) => {
        const { projectId, userId } = req.params;

        if (!validId(projectId) || !validId(userId)) {
            return res.status(400).json({
                message: "Invalid project or user ID."
            });
        }

        try {
            const convertedProjectId = new ObjectId(projectId);
            const convertedUserId = new ObjectId(userId);

            const project = await projects.findOne({
                _id: convertedProjectId
            });

            if (!project) {
                return res.status(404).json({
                    message: "Project was not found."
                });
            }

            if (project.project_lead_id.equals(convertedUserId)) {
                return res.status(400).json({
                    message: "The project lead cannot be removed."
                });
            }

            const result = await projectMemberships.deleteOne({
                project_id: convertedProjectId,
                user_id: convertedUserId
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    message: "Membership was not found."
                });
            }

            return res.status(200).json({
                message: "Project member removed successfully."
            });
        } catch (error) {
            console.error("Remove project member error:", error);

            return res.status(500).json({
                message: "Could not remove the project member."
            });
        }
    }
);

// ---------- SERVER STARTUP ----------

async function startServer() {
    try {
        await client.connect();

        const db = client.db("pa2");

        users = db.collection("users");
        projects = db.collection("projects");
        projectMemberships =
            db.collection("projectMemberships");

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