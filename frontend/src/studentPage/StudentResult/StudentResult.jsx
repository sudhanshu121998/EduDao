import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ImagePopup from "../../Components/ImagePopUp/ImagePopup";
import QuestionSkeleton from "../../Components/QuestionSkeleton/QuestionSkeleton";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const StudentResult = () => {
    const { quizId, studentId, isteacher } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    // const [responses, setResponses] = useState({});
    // const [correctAnswers, setCorrectAnswers] = useState({});
    const [score, setScore] = useState(0);
    const [rank, setRank] = useState(0);
    const [quizName, setQuizName] = useState("");
    const [isLoading,setIsLoading]=useState(false);

    

    useEffect(() => {
        const fetchStudentResult = async () => {
            try {

                setIsLoading(true);
                const response = await axios.post(
                    `${backendUrl}/api/auth/rsa/studentresult`,
                    { quizId, studentId },
                    { withCredentials: true }
                );
                console.log("📦 Student result:", response.data);
              

               



                setQuestions(response.data);
                console.log("heew")
                
            } catch (e) {
                console.error("❌ Error fetching student response:", e);
            }
            finally{
                setIsLoading(false);
            }
        };
    
        
            fetchStudentResult();
        
    }, [quizId, studentId]);
    useEffect(() => {
        const calculateAndSendScore = async () => {
            let correctQuestions = 0;
            questions.forEach((q) => {
                if (q.isCorrect) correctQuestions++;
            });
    
            setScore(correctQuestions);
    
           
        };
    
        if (questions.length > 0) {
            calculateAndSendScore();
        }
    }, [questions]);
    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold text-center mb-4 text-yellow-400">Quiz Results</h1>
            <h2 className="text-xl text-center text-gray-300">{quizName}</h2>
            <h3 className="text-lg text-center mt-2 text-gray-400">
                Your Score: <span className="font-bold text-yellow-400">{score} / {questions.length}</span>
                {/* Your Score: <span className="font-bold text-yellow-400">{questions.length}</span> */}
            </h3>
            {/* <h3 className="text-lg text-center mt-2 text-gray-400">
                Your Rank: <span className="font-bold text-yellow-400">{rank}</span>
            </h3> */}

            <div className="mt-6 border border-gray-700 p-4 rounded-lg shadow-lg bg-gray-800">
                {
                    isLoading && <QuestionSkeleton></QuestionSkeleton>
                }
                {questions.map((question, index) => (
                    <div key={question.questionId} className="mb-6 p-4 border-b border-gray-700">
                        <div className="flex flex-wrap gap-4">
                            {question.images?.map((image, idx) => (
                                <ImagePopup key={idx} index={idx} image_url={image} />
                            ))}
                        </div>
                        <p className="font-semibold text-gray-200">{index + 1}. {question.question}</p>
                        <div className="mt-2">
                            {["optionA", "optionB", "optionC", "optionD"].map((option) => (
                                <div 
                                    key={option} 
                                    className={`p-2 rounded-md my-1 transition 
                                        ${
                                           question.selectedOption=== question[option] && question.correctAnswer !== question[option]
                                                ? "bg-red-600 text-white"
                                                : ""
                                        } 
                                        ${
                                            question.correctAnswer === question[option]
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-700 text-gray-300"
                                        }`}
                                >
                                    {question[option]}
                                </div>
                            ))}
                        </div>
                        <p className="mt-2">
                            ✅ Correct Answer: <span className="text-green-400 font-bold">{question.correctAnswer}</span>
                        </p>
                        <p>
                            🏷️ Your Answer: 
                            <span 
                                className={`font-bold ml-2 ${
                                    question.selectedOption === question.correctAnswer
                                        ? "text-green-400"
                                        : "text-red-400"
                                }`}
                            >
                                {question.selectedOption  || "Not Attempted"}
                            </span>
                        </p>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6">
                <button 
                    className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition duration-200"
                    onClick={() => { isteacher === "true" ? navigate("/teacher/homepage") : navigate("/student/homepage") }}
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
};

export default StudentResult;
