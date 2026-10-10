import { useState } from "react";

function Login() {
    // local state for login fields and feedback
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault(); // prevent page reload
        setMessage("");   // clear previous messages

        // basic validation
        if (!username.trim() || !password) {
            setMessage("Username and password are required.");
            return;
        }

        try {
            // send login request to backend API
            const response = await fetch("http://localhost:9000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password
                })
            });

            const data = await response.json();
            setMessage(data.message); // display server response

            // clear fields on successful login
            if (response.ok) {
                setUsername("");
                setPassword("");
            }
        } catch (error) {
            console.error("Login request failed:", error);
            setMessage("Could not connect to the server.");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>

            <div>
                <label htmlFor="login-username">
                    Username
                </label>

                <input
                    id="login-username"
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
                <label htmlFor="login-password">
                    Password
                </label>

                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                />
            </div>

            <button type="submit">
                Login
            </button>

            {message && <p>{message}</p>}
        </form>
    );
}

export default Login;