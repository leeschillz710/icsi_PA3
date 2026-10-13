import { useState } from "react";

const API_URL = "http://localhost:9000";

function CreateProject({ users, onProjectCreated }) {
    // store each controlled project-form value
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    // planning is the initial permitted status
    const [status, setStatus] = useState("Planning");
    // this holds the selected user's MongoDB ID,
    // not the person's displayed name
    const [projectLeadId, setProjectLeadId] = useState("");
    const [message, setMessage] = useState("");
    // used to disable the button during the request
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        if (
            !name.trim() ||
            !description.trim() ||
            !status ||
            !projectLeadId
        ) {
            setMessage("All project fields are required.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `${API_URL}/api/projects`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        description: description.trim(),
                        status,
                        // send the selected user's ID
                        project_lead_id: projectLeadId
                    })
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                // reset the form after creation
                setName("");
                setDescription("");
                setStatus("Planning");
                setProjectLeadId("");

                // ask App to refresh the project list and select
                // the newly created project
                await onProjectCreated(data.projectId);
            }
        } catch (error) {
            console.error("Create project request failed:", error);
            setMessage("Could not connect to the server.");
        } finally {
            // this runs after either success or failure
            setSubmitting(false);
        }
    }

    return (
        <section>
            <h2>Create Project</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="project-name">
                        Project Name
                    </label>

                    <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        required
                    />
                </div>

                <div>
                    <label htmlFor="project-description">
                        Description
                    </label>

                    <textarea
                        id="project-description"
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                        required
                    />
                </div>

                <div>
                    <label htmlFor="project-status">
                        Status
                    </label>

                    <select
                        id="project-status"
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value)
                        }
                    >
                        <option value="Planning">
                            Planning
                        </option>
                        <option value="Active">
                            Active
                        </option>
                        <option value="Completed">
                            Completed
                        </option>
                    </select>
                </div>

                <div>
                    <label htmlFor="project-lead">
                        Project Lead
                    </label>

                    <select
                        id="project-lead"
                        value={projectLeadId}
                        onChange={(event) =>
                            setProjectLeadId(event.target.value)
                        }
                        required
                    >
                        <option value="">
                            Select a project lead
                        </option>

                        {users.map((user) => (
                            <option
                                key={user._id}
                                value={user._id}
                            >
                                {user.f_name} {user.l_name}
                                {" "}({user.username})
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={submitting}>
                    {submitting
                        ? "Creating..."
                        : "Create Project"}
                </button>

                {message && <p>{message}</p>}
            </form>
        </section>
    );
}

export default CreateProject;