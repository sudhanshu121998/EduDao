import React, { useContext, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { AuthContext } from "../../../lib/authContext/AuthContext";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

// Register necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const QuizBarGraph = () => {
    const { currentUser } = useContext(AuthContext);
    const [quizData, setQuizData] = useState([]);
    const navigate = useNavigate(); // Hook for navigation

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/auth/teacher/getteacherbyid?teacherId=${currentUser.id}`, { withCredentials: true });

                // Extract, sort, and filter quizzes
                const sortedQuizzes = [...res.data.quizzes]
                    .sort((a, b) => {
                        const dateA = new Date(`${a.date}T${a.startTime}`);
                        const dateB = new Date(`${b.date}T${b.startTime}`);
                        return dateB - dateA; // Sort latest first
                    })
                    .filter(q => q.attempts.length >= 1); // Only quizzes with attempts

                // Map sorted quizzes
                {console.log("sortedQuizzes",sortedQuizzes)};
                const formattedData = sortedQuizzes.map(q => ({
                   
                    id: q.id, // Store quiz ID for redirection
                    name: q.quizName,
                    attempts: q.attempts.length,
                }));

                setQuizData(formattedData);
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        };

        fetchQuizzes();
    }, []);

    // Define the dataset for the chart
    const data = {
        labels: quizData.map(q => q.name), // Quiz names
        datasets: [
            {
                label: "Students Attempted",
                data: quizData.map(q => q.attempts), // Number of attempts
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Handle bar click event
    const handleBarClick = (event, elements) => {
        if (elements.length > 0) {
            const index = elements[0].index; // Get clicked bar index
            const selectedQuiz = quizData[index]; // Get corresponding quiz

            if (selectedQuiz) {
                console.log("seslectedQuiz",selectedQuiz);
                navigate(`/teacher/homepage/quizresult/${selectedQuiz.id}`); // Redirect to student results
            }
        }
    };

    // Chart options
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Quiz Performance (Students Attempted)",
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Quizzes",
                },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Students",
                },
            },
        },
        onClick: handleBarClick, // Attach click event
    };

    return <Bar data={data} options={options} />;
};

export default QuizBarGraph;