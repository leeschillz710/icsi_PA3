import { useEffect, useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";

const API_URL = "http://localhost:9000";

function App() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] =
        useState("");
    const [dataError, setDataError] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadInitialData() {
            try {
                const [usersResponse, projectsResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/api/users`),
                        fetch(`${API_URL}/api/projects`)
                    ]);

                const usersData =
                    await usersResponse.json();
                const projectsData =
                    await projectsResponse.json();

                if (!usersResponse.ok) {
                    throw new Error(
                        usersData.message ||
                        "Could not retrieve users."
                    );
                }

                if (!projectsResponse.ok) {
                    throw new Error(
                        projectsData.message ||
                        "Could not retrieve projects."
                    );
                }

                if (!ignore) {
                    setUsers(usersData);
                    setProjects(projectsData);
                }
            } catch (error) {
                if (!ignore) {
                    setDataError(error.message);
                }
            }
        }

        loadInitialData();

        return () => {
            ignore = true;
        };
    }, []);
    async function refreshUsers() {
        try {
            const response = await fetch(
                `${API_URL}/api/users`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not retrieve users."
                );
            }

            setUsers(data);
            setDataError("");
        } catch (error) {
            setDataError(error.message);
        }
    }

    async function refreshProjects() {
        const response = await fetch(
            `${API_URL}/api/projects`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not retrieve projects."
            );
        }

        setProjects(data);
    }

    async function handleProjectCreated(projectId) {
        try {
            await refreshProjects();
            setSelectedProjectId(projectId);
            setDataError("");
        } catch (error) {
            setDataError(error.message);
        }
    }

    const selectedProject = projects.find(
        (project) =>
            String(project._id) ===
            String(selectedProjectId)
    );

    return (
        <main>
            <h1>Project Management</h1>

            <section>
                <Signup onSignupSuccess={refreshUsers} />
                <Login />
            </section>

            {dataError && <p>{dataError}</p>}

            <CreateProject
                users={users}
                onProjectCreated={handleProjectCreated}
            />

            <ProjectList
                projects={projects}
                users={users}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
            />

            <ProjectMembers
                project={selectedProject}
                users={users}
            />
        </main>
    );
}

export default App;