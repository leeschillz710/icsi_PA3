function ProjectList({
    projects,
    users,
    selectedProjectId,
    onSelectProject
}) {
    // a Project stores a lead ID, so this function finds the
    // corresponding readable user record.
    function findLead(projectLeadId) {
        return users.find(
            (user) =>
                String(user._id) === String(projectLeadId)
        );
    }

    return (
        <section>
            <h2>Projects</h2>

            {projects.length === 0 ? (
                <p>No projects have been created.</p>
            ) : (
                <ul>
                    {projects.map((project) => {
                        const lead = findLead(
                            project.project_lead_id
                        );

                        return (
                            <li key={project._id}>
                                <h3>{project.name}</h3>
                                <p>{project.description}</p>
                                <p>Status: {project.status}</p>
                                <p>
                                    Project Lead:{" "}
                                    {lead
                                        ? `${lead.f_name} ${lead.l_name} (${lead.username})`
                                        : "Unknown user"}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelectProject(
                                            project._id
                                        )
                                    }
                                >
                                    {selectedProjectId ===
                                    project._id
                                        ? "Viewing Members"
                                        : "View Members"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default ProjectList;