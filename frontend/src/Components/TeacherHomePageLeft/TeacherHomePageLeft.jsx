import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../lib/authContext/AuthContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const TeacherHomePageLeft = () => {
    const [quizzes, setQuizzes] = useState([]);  // Store all quizzes
    const [filteredQuizzes, setFilteredQuizzes] = useState([]);  // Store filtered quizzes
    const [searchQuery, setSearchQuery] = useState("");  // Search input state
    const navigate = useNavigate();

    const { currentUser } = useContext(AuthContext);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/auth/teacher/homepage/getquiz?teacherId=${currentUser.id}`, { withCredentials: true });
                setQuizzes(res.data);
                setFilteredQuizzes(res.data);  // Initially, show all quizzes
                console.log("asfhjaksnflakf")
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        };

        fetchQuizzes();
    }, []);

    // Filter quizzes when searchQuery changes
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredQuizzes(quizzes); // Show all if search is empty
        } else {
            setFilteredQuizzes(
                quizzes.filter(quiz =>
                    quiz.quizName.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
    }, [searchQuery, quizzes]);

    return (
        <div>
            {/* Search Bar */}
            {console.log(currentUser)}
            <input
                type="text"
                placeholder="Find Quiz"
                className="border border-black border-solid m-2 px-2 py-1 w-full text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Quiz List */}
            {filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center cursor-pointer hover:font-bold" onClick={() => {
                        navigate(`/teacher/homepage/quizresult/${quiz.id}`);
                    }}>
                        <img src="/Avatar.jpg" alt="Quiz Avatar" className="size-8 rounded-full m-4" />
                        <div>{quiz.quizName}</div>
                    </div>
                ))
            ) : (
                <p>No quizzes found.</p>
            )}
        </div>
    );
};

export default TeacherHomePageLeft;