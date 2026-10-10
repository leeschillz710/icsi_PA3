import { useState } from "react";

function Signup() {
    // local state for form firels and feedback messages
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        // basic client-side validation
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !username.trim() ||
            !password
        ) {
            setMessage("All fields are required.");
            return;
        }

        try {
            // send signup request to backend API
            const response = await fetch("http://localhost:9000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    f_name: firstName.trim(),
                    l_name: lastName.trim(),
                    username: username.trim(),
                    password
                })
            });

            const data = await response.json();
            setMessage(data.message); // display server response
            
            // if signup successful, clear form fields
            if (response.ok) {
                setFirstName("");
                setLastName("");
                setUsername("");
                setPassword("");
            }
        } catch (error) {
            console.error("Signup request failed:", error);
            setMessage("Could not connect to the server.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Sign Up</h2>

            <div>
                <label htmlFor="signup-first-name">
                    First Name
                </label>

                <input
                    id="signup-first-name"
                    type="text"
                    value={firstName}
                    onChange={(event) =>
                        setFirstName(event.target.value)
                    }
                    autoComplete="given-name"
                    required
                />
            </div>

            <div>
                <label htmlFor="signup-last-name">
                    Last Name
                </label>

                <input
                    id="signup-last-name"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                        setLastName(event.target.value)
                    }
                    autoComplete="family-name"
                    required
                />
            </div>

            <div>
                <label htmlFor="signup-username">
                    Username
                </label>

                <input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                        setUsername(event.target.value)
                    }
                    autoComplete="username"
                    required
                />
            </div>

            <div>
                <label htmlFor="signup-password">
                    Password
                </label>

                <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                />
            </div>

            <button type="submit">
                Sign Up
            </button>

            {message && <p>{message}</p>}
        </form>
    );
}

export default Signup;