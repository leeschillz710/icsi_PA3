// import packages used by the backend
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

// load variables from server/.env into process.env
dotenv.config();

// create the express application
const app = express();
const PORT = 9000;

// allow the React client to communicate with this server
app.use(cors());
// convert incoming JSON request bodies into JavaScript objects
// w/o this req.body would normally be undefined
app.use(express.json());


// create the MongoDB client using the private connection string
// stored in server/.env
const client = new MongoClient(process.env.MONGO_URI);

// these variables will recieve references to the MongoDB collections
// after the database connection succeeds
let users;
let projects;
let projectMemberships;

// allowed project statuses
const allowedStatuses = ["Planning", "Active", "Completed"];

// check whether a value is a string that MongoDB can convert into
// an objectId. This prevents new ObjectId() from throwing an exception
// when a malformed ID is recieved.
function validId(id) {
    return typeof id === "string" && ObjectId.isValid(id);
}

// ---------- SIGNUP ROUTE ----------

app.post("/signup", async (req, res) => {
    // read the signup info sent by React
    const { f_name, l_name, username, password } = req.body;

    // reject the request when any required value is missing
    // trim() prevents whitespace-only names from being accepted
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
        // remove extra whitespace from the username
        const cleanUsername = username.trim();
        
        // search the Users collection for the same username
        const existingUser = await users.findOne({
            username: cleanUsername
        });

        // a duplicate username is a conflict, represented by 409
        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        // hash the password before placing it in MongoDB
        // the original password is never stored
        const passwordHash = await bcrypt.hash(password, 10);

        // insert the new user document
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
        // print detailed developer info in the server
        // terminal w/o exosing it to the browser
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
        // find the account with the submitted username
        const user = await users.findOne({
            username: username.trim()
        });

        // do not reveal whether the username or password failed
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        // compare the submitted password with the saved hash
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
                    // never send password hashes to React
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
    // read the project fields sent by CreateProject.jsx
    const {
        name,
        description,
        status,
        project_lead_id
    } = req.body;

    // make suure all required project fields were submitted
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
    
// reject any status that is not permitted
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid project status."
        });
    }

    // validate the Lead ID before converting it
    if (!validId(project_lead_id)) {
        return res.status(400).json({
            message: "Invalid project lead ID."
        });
    }

    try {
        // React submits IDs as strings. MongoDB relationships are stored
        // as ObjectIds, so conversion is necessary
        const leadId = new ObjectId(project_lead_id);


        // verify the selected lead is a real user
        const lead = await users.findOne({
            _id: leadId
        });

        if (!lead) {
            return res.status(404).json({
                message: "Project lead was not found."
            });
        }

        // build the document that will be saved in Projects
        const project = {
            name: name.trim(),
            description: description.trim(),
            status,
            project_lead_id: leadId
        };

        // insert the project and save the generated ID
        const result = await projects.insertOne(project);

        // automatically make the Project Lead a member.
        // This is a separate ProjectMemberships document
        await projectMemberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        return res.status(201).json({
            message: "Project created successfully.",
            // return a string becuase React will use this value to 
            // select the newly created project
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
    // the project ID is in the URL
    const { projectId } = req.params;
    // the user ID is in the JSON request body
    const { user_id } = req.body;

    // both IDs must be valid before conversion
    if (!validId(projectId) || !validId(user_id)) {
        return res.status(400).json({
            message: "Invalid project or user ID."
        });
    }

    try {
        const convertedProjectId = new ObjectId(projectId);
        const convertedUserId = new ObjectId(user_id);

        // verify that the project exists
        const project = await projects.findOne({
            _id: convertedProjectId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project was not found."
            });
        }

        // verify the user exists
        const user = await users.findOne({
            _id: convertedUserId
        });

        if (!user) {
            return res.status(404).json({
                message: "User was not found."
            });
        }
        // search for a membership containing exact project-and-user combo
        const existingMembership =
            await projectMemberships.findOne({
                project_id: convertedProjectId,
                user_id: convertedUserId
            });
        // prevent the same user from joining the same project more than once
        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this project."
            });
        }
        // create relationship between the 2 records
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
        // both identifiers are contained in the URL
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

            // deletedCount is 0 when there was no matching membershp to remove
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

// ----------- SERVER STARTUP ----------
//------ CONNECT TO MONGODB AND START EXPRESS --------

async function startServer() {
    try {
        // establish the MongoDB connection first
        await client.connect();

        // continue using the PA2 database so the existing registered
        // users are available to PA3
        const db = client.db("pa2");

        // obtain references to all 3 collections
        users = db.collection("users");
        projects = db.collection("projects");
        projectMemberships =
            db.collection("projectMemberships");
        
        // ensure that MongoDB rejects duplicate usernames, even
        // if 2 requests arrive almost simultaneously
        await users.createIndex(
            { username: 1 },
            { unique: true }
        );

        console.log("Connected to MongoDB");

        // begin accepting HTTP requests only after the 
        // database connection is ready
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