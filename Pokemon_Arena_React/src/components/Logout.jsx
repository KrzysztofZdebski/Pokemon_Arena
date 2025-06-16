import React from 'react';
import Cookies from 'js-cookie';
import authApi from '../utils/authApi';
import { useContext } from 'react';
import axios from "axios";
import AuthContext from "../utils/authProvider"; // Import the AuthContext
import { useNavigate } from "react-router-dom";
import Button from './Button';

const Logout = () => {
    const {setAuthenticated} = useContext(AuthContext); // Import the AuthContext
    const navigate = useNavigate(); // Initialize the navigate function

    async function logoutUser(event) {
        event.preventDefault(); 
        const csrfToken = Cookies.get('csrf_refresh_token'); 
        // onLoading(true); // Set loading state to true

        await authApi.delete("/api/v1/auth/logout/access")
        .then(response => {
            console.log(response.data); 
            console.log('logged out access token');
        })
        .catch(error => {
            console.error("There was an error logging out!", error);
            alert("An error occurred. Please try again later.");
        });
        localStorage.removeItem('access_token'); 
        await axios.delete("http://localhost:5000/api/v1/auth/logout/refresh", {
            headers: {
                'X-CSRF-Token': csrfToken, 
            },
            withCredentials: true
        })
        .then(response => {
            console.log(response.data); 
            console.log('logged out refresh token');
            setAuthenticated(false); // Set the authenticated state to false
        })
        .catch(error => {
            console.error("There was an error logging out!", error);
            alert("An error occurred. Please try again later.");
        });
        navigate('/'); // Redirect to the main page

    }

    return <Button onClick={logoutUser} className="mt-4">Logout</Button>;
}

export default Logout;