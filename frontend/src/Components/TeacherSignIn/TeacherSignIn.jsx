import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../lib/authContext/AuthContext.jsx";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const TeacherSignIn = () => {
    const { updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        setErrors({ ...errors, [id]: "" });
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const res = await axios.post(`${backendUrl}/api/auth/teacher/login`, formData, {
                withCredentials: true,
            });
            
           
            updateUser(res.data);
            navigate("/teacher/homepage");
        } catch (err) {
            console.error("Login failed", err);
            setErrors({ api: "Invalid email or password" });
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
            <form
                onSubmit={handleSubmit}
                className="w-[90%] max-w-lg text-white flex flex-col border border-gray-700 p-6 rounded-lg shadow-xl backdrop-blur-lg bg-white/10"
            >
                <h2 className="text-3xl font-bold text-center mb-6 text-white">Teacher Sign In</h2>

                {["email", "password"].map((id) => (
                    <div key={id} className="flex flex-col mb-4">
                        <label htmlFor={id} className="mb-1 text-gray-300">
                            {id.charAt(0).toUpperCase() + id.slice(1)}:
                        </label>
                        <input
                            id={id}
                            type={id}
                            className="p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                            value={formData[id]}
                            onChange={handleInputChange}
                        />
                        {errors[id] && <p className="text-red-400 text-sm">{errors[id]}</p>}
                    </div>
                ))}

                {errors.api && <p className="text-red-400 text-center">{errors.api}</p>}

                <button
                    type="submit"
                    className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg font-bold shadow-md transition-all duration-300 ease-in-out hover:bg-green-700 active:scale-95"
                >
                    Sign In
                </button>

                <div className="flex justify-center space-x-2 mt-3 text-gray-300">
                    <span>Don't have an account?</span>
                    <Link to="/teacher/register" className="text-green-400 hover:underline">
                        Sign Up
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default TeacherSignIn;