import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../utils/authProvider.jsx"; // Import the AuthContext
import Button from "../components/Button.jsx";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const {setAuthenticated, setGlobalEmail, setGlobalUsername} = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/account";

    function loginUser(event) {
        event.preventDefault(); 
        const loginData = {
            username: username,
            password: password
        };

        axios.post("http://localhost:5000/api/v1/auth/login", loginData, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true
        })
        .then((response) => {
            console.log(response);
            console.log(response.data); // Log the response to see its structure
            if (response.status === 200) {
                const newAccessToken = response.data.access_token;
                localStorage.setItem('access_token', newAccessToken);
                setAuthenticated(true); // Set the authenticated state to true
                setGlobalUsername(response.data.data.username || ''); // Set username from response
                setGlobalEmail(response.data.data.email || ''); // Set email from response
                navigate(from, { replace: true }); // Redirect to intended page
            } else {
                alert("Login failed. Please check your credentials.");
            }
        })
        .catch(error => {
            console.error("There was an error logging in!", error);
            alert("An error occurred. Please try again later.");
        });
    }    return (
        <>
        <div className={` min-h-screen bg-gradient-to-br from-pokemon-blue to-pokemon-red w-screen`}>
            <div className="container px-6 py-12 mx-auto">
                <div className="flex items-center justify-center pt-10">
                    <div className={`flex flex-col items-center w-full max-w-md p-8 bg-white/10 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20`}>
                        <h2 className={`mb-6 text-3xl font-bold text-white`}>Login to Pokemon Arena</h2>                        <form className="flex flex-col w-full gap-4" onSubmit={loginUser}>
                            <div className="flex flex-col gap-1 form-group">
                                <label htmlFor="username" className={`font-medium text-white`}>Username:</label>
                                <input 
                                    type="text" 
                                    id="username" 
                                    required 
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="px-4 py-2 text-white transition border rounded-lg border-white/30 bg-white/20 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pokemon-yellow focus:border-transparent"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="flex flex-col gap-1 form-group">
                                <label htmlFor="password" className={`font-medium text-white`}>Password:</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    required 
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="px-4 py-2 text-white transition border rounded-lg border-white/30 bg-white/20 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pokemon-yellow focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full mt-4 btn-primary"
                            >
                                Login
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default Login;