import React, {useContext} from "react";
import Logout from "../components/Logout";
import AuthContext from "../utils/authProvider";

function Account() {
    const {username, email} = useContext(AuthContext);

    return (
    <>
    <div className="w-screen min-h-screen mt-20">
        <div className="container px-6 py-12 mx-auto">
            <p className="mb-6 text-3xl font-bold text-center text-white">{username}</p>
            <p className="mb-6 text-3xl font-bold text-center text-white">{email}</p>
            <Logout />
        </div>
    </div>
    </>
    );
}

export default Account;