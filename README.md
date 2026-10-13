# ICSI 418 — Programming Assignment 3

A full-stack project-management application built with React, Express, Node.js, and MongoDB.

This assignment extends the signup and login application from Programming Assignment 2 by adding projects and project memberships.

## Features

### User accounts

- Register users with a first name, last name, username, and password.
- Prevent duplicate usernames.
- Hash passwords before storing them.
- Log in with registered credentials.
- Refresh the available user list after a successful signup.

### Projects

- Create projects with a name, description, status, and Project Lead.
- Select a Project Lead from the registered users.
- Automatically add the Project Lead as a project member.
- View all created projects.
- Display the Project Lead’s readable name.
- Use the following project statuses:
  - `Planning`
  - `Active`
  - `Completed`

### Project memberships

- View the members of a selected project.
- Add registered users to projects.
- Allow one user to participate in multiple projects.
- Prevent a user from joining the same project twice.
- Remove non-lead members.
- Prevent the Project Lead from being removed.
- Refresh the displayed member list after additions and removals.

## Technologies

### Frontend

- React
- Vite
- JavaScript
- Fetch API

### Backend

- Node.js
- Express.js
- MongoDB Node.js Driver
- bcryptjs
- CORS
- dotenv

### Database

- MongoDB Atlas

## Project structure

```
icsi418-PA3/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateProject.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProjectList.jsx
│   │   │   ├── ProjectMembers.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── README.md
```

## Database structure

The application uses the `pa2` MongoDB database because PA3 continues from the user accounts created during PA2.

### `users` collection

A user document contains information similar to:

```text
_id
f_name
l_name
username
password
```

The password is stored as a bcrypt hash rather than plain text.

### `projects` collection

A project document contains:

```
_id
name
description
status
project_lead_id
```

`project_lead_id` is an ObjectId that references a document in the `users` collection.

### `projectMemberships` collection

A membership document contains:

```
_id
project_id
user_id
```

- `project_id` references a document in the `projects` collection.
- `user_id` references a document in the `users` collection.
- Each membership represents one user participating in one project.

## Relationship overview

```
users
  │
  ├──────────────┐
  │              │
  ▼              ▼
projects    projectMemberships
```

A user can participate in multiple projects, and a project can have multiple users.

## Environment configuration

Create a file named `.env` inside the `server` folder:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

Do not commit the `.env` file to GitHub.

Before running the application, confirm that:

- Your current public IP address is included in the MongoDB Atlas Network Access list.
- The MongoDB database user has read and write permission.
- The Atlas connection string contains the correct username and password.
- Special characters in the database password are URL-encoded.

## Installation

Clone the repository and install the server and client dependencies.

### Install backend dependencies

```powershell
cd C:\Users\leigh\Documents\icsi418-PA3\server
npm install
```

### Install frontend dependencies

```powershell
cd C:\Users\leigh\Documents\icsi418-PA3\client
npm install
```

## Running the application

The backend and frontend must run in separate terminals.

### Start the backend

In the first terminal:

```powershell
cd C:\Users\leigh\Documents\icsi418-PA3\server
node server.js
```

Expected output:

```
Connected to MongoDB
Server running at http://localhost:9000
```

### Start the frontend

In the second terminal:

```powershell
cd C:\Users\leigh\Documents\icsi418-PA3\client
npm run dev
```

Open the local address displayed by Vite, normally:

```
http://localhost:5173
```

Press `Ctrl+C` in each terminal to stop the application.

## API endpoints

| Purpose | Method | Endpoint |
|---|---|---|
| Register a user | POST | `/signup` |
| Log in | POST | `/login` |
| Get registered users | GET | `/api/users` |
| Create a project | POST | `/api/projects` |
| Get all projects | GET | `/api/projects` |
| Get a project’s members | GET | `/api/projects/:projectId/members` |
| Add a project member | POST | `/api/projects/:projectId/members` |
| Remove a project member | DELETE | `/api/projects/:projectId/members/:userId` |

## HTTP responses

The backend uses the following status codes:

| Status | Meaning |
|---|---|
| `200` | Request completed successfully |
| `201` | Project, user, or membership created |
| `400` | Missing or invalid input |
| `401` | Invalid login credentials |
| `404` | User, project, or membership not found |
| `409` | Duplicate username or membership |
| `500` | Unexpected server or database error |

## Validation

The backend validates that:

- Required values are provided.
- Project statuses are permitted.
- MongoDB identifiers are valid ObjectIds.
- The selected Project Lead exists.
- The selected project exists.
- A user exists before being added to a project.
- A membership does not already exist.
- The Project Lead cannot be removed.

Backend validation is performed even when the React interface already validates the same information.

## Testing checklist

### Existing functionality

- Signup creates a new user.
- Duplicate usernames are rejected.
- Login accepts correct credentials.
- Login rejects incorrect credentials.
- Newly registered users appear in the lead and member dropdowns.

### Projects

- A project can be created with all required information.
- Missing fields are rejected.
- The Project Lead is selected from registered users.
- The Project Lead is automatically added as a member.
- Multiple projects can be created.
- Projects display the correct status and lead name.

### Memberships

- A registered user can be added to a project.
- Several users can participate in one project.
- One user can participate in several projects.
- Duplicate memberships are rejected.
- A non-lead member can be removed.
- The Project Lead cannot be removed.
- The displayed list updates after additions and removals.

### MongoDB

Verify the following collections in the `pa2` database:

```
users
projects
projectMemberships
```

Confirm that:

- Relationship fields are stored as ObjectIds.
- Every Project Lead has a membership document.
- Removed memberships no longer appear.
- Duplicate membership documents are not created.

## Example test data

### Users

| Name | Username |
|---|---|
| Gordon Ramsay | `gordonramsay` |
| Dolly Parton | `dollyparton` |
| Snoop Dogg | `snoopdogg` |
| Albert Einstein | `alberteinstein` |

### Example project 1

```
Name: Gordon Ramsay’s Cloud Kitchen
Description: A deployment system that screams at unfinished code until it becomes production-ready.
Status: Active
Project Lead: Gordon Ramsay
```

### Example project 2

```
Name: Dolly Parton’s 9-to-5 Scheduler
Description: A scheduling application that automatically stops all meetings at five o’clock and starts singing.
Status: Planning
Project Lead: Dolly Parton
```

Albert Einstein can be added to both projects to demonstrate that one user may participate in multiple projects.

## Viewing the data in MongoDB Atlas

1. Sign in to MongoDB Atlas.
2. Select the correct organization and project.
3. Open **Database → Data Explorer**.
4. Select the application’s cluster.
5. Expand the `pa2` database.
6. Select the `projects` collection.
7. Open the **Documents** tab.
8. Select the `projectMemberships` collection.
9. Open the **Documents** tab.

The relationship values can be verified by comparing:

```
projects._id
    =
projectMemberships.project_id
```

```
users._id
    =
projectMemberships.user_id
```

```
users._id
    =
projects.project_lead_id
```

## Common problems

### New users do not appear in dropdowns

Confirm that the signup component calls the user-refresh function after a successful registration.

### MongoDB returns no matching document

Confirm that incoming string IDs are validated and converted to ObjectIds before database queries.

### The frontend cannot contact the server

Confirm that:

- The backend is running on port `9000`.
- The frontend uses `http://localhost:9000`.
- CORS is enabled.
- The request route and HTTP method are correct.

### MongoDB Atlas rejects the connection

Confirm that:

- The current IP address is permitted.
- The `.env` connection string is correct.
- The database credentials are valid.
- The server was started from the `server` directory.

### The member list does not update

After adding or removing a membership, retrieve the project’s current memberships again and update React state.

## Security notes

- Passwords are hashed with bcrypt before storage.
- Password hashes are excluded from the registered-users API response.
- The MongoDB connection string is stored in `.env`.
- User input is validated by the backend.
- Database relationships use ObjectIds instead of names.
