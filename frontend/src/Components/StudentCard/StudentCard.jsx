import axios from "axios";
import React, { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const StudentCard = ({ score, quizId }) => {
    const [quizName, setQuizName] = useState("");

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(
                    `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
                    { withCredentials: true }
                );
                setQuizName(res.data.quizName);
            } catch (error) {
                console.error("Error fetching quiz:", error);
            }
        };

        fetchQuiz();
    }, [quizId]); // Added quizId as a dependency for best practices

    return (
        <div className="bg-gray-800 shadow-md border border-gray-700 rounded-lg p-4 w-80 mx-auto my-4 transition-transform transform hover:scale-105 hover:brightness-110">
            <h2 className="text-lg font-semibold text-white">{quizName || "Loading..."}</h2>
            <p className="text-gray-300 mt-2">
                Score: <span className="font-bold text-yellow-400">{score}</span>
            </p>
        </div>
    );
};

export default StudentCard;
