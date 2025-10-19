import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../lib/authContext/AuthContext";
import StudentCard from "../../Components/StudentCard/StudentCard";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const StudentHomePage = () => {
    const [attempts, setAttempts] = useState([]);
    const [quizCode, setQuizCode] = useState(""); 
    const { currentUser, setCurrentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchQuizzes = async () => {
            if (!currentUser?.id) return;
            try {
                const res = await axios.post(
                    `${backendUrl}/api/auth/rsa/showscore`,
                    {
                        studentId:currentUser.id
                    },
                    { withCredentials: true }
                );
                setAttempts(res.data);
            } catch (error) {
                console.error("Error fetching quizzes scores:", error);
            }
        };

        fetchQuizzes();
    }, [currentUser?.id]);

    if (!currentUser?.id) return <div className="text-white">Loading...</div>;

    const handleQuizAttempt = (e) => {
        e.preventDefault();
        if (!quizCode.trim()) {
            alert("Please enter a quiz code.");
            return;
        }
        navigate(`/student/quiz/${quizCode}`);
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${backendUrl}/api/auth/student/logout`, {}, { withCredentials: true });
            setCurrentUser(null);
            navigate("/student/signin");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="p-6 h-full w-full relative bg-gray-900 text-white min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <Link to="/">
                    <img src="/quiz.jpg" alt="Quiz" className="h-16 rounded-lg shadow-md" />
                </Link>

                <div className="flex items-center space-x-6">
                    <form
                        className="flex items-center bg-gray-700 p-4 rounded-lg shadow-lg"
                        onSubmit={handleQuizAttempt}
                    >
                        <h1 className="text-lg font-semibold text-gray-300 mr-3">Attempt Quiz</h1>

                        <input
                            type="text"
                            placeholder="Enter Quiz Code"
                            value={quizCode}
                            onChange={(e) => setQuizCode(e.target.value)}
                            className="w-48 px-4 py-2 border border-gray-600 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        />

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-500 transition duration-200 ml-3"
                        >
                            Attempt
                        </button>
                    </form>

                    {/* Avatar & Dropdown */}
                    <div className="relative">
                        <img
                            src="/Avatar.jpg"
                            alt="User Avatar"
                            className="size-14 rounded-full cursor-pointer hover:opacity-80 transition duration-200"
                            onClick={() => setDropdownOpen((prev) => !prev)}
                        />
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quizzes Attempted */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attempts.length > 0 ? (
                    attempts.map((attempt, index) => (
                        <Link key={index} to={`/student/result/${attempt.quizId}/${currentUser.id}/false`}>
                            <StudentCard
                                quizId={attempt.quizId}
                                score={attempt.score}
                                className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg shadow-md transition duration-200"
                            />
                        </Link>
                    ))
                ) : (
                    <p className="text-center text-gray-400 col-span-full mt-6">No quiz attempts yet.</p>
                )}
            </div>
        </div>
    );
};

export default StudentHomePage;
