'use client'
import Login from "../Login";
import Register from "../Register";

//Authentication page that contains both the login and register components. This page is used to authenticate the user and allow them to access the protected routes of the application.
export default function Authentication() {
    return (
        <div className="flex flex-row gap-20">
            <Login />
            <Register />
        </div>
    )
}