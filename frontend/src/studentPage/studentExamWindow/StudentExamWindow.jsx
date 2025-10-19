import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../lib/authContext/AuthContext";
import ImagePopup from "../../Components/ImagePopUp/ImagePopup";
import moment from "moment";
import { ClipLoader } from "react-spinners";
import StudentExamWindowSkalaton from "../../Components/StudentExamWindowSkalaton/StudentExamWindowSkalaton";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const StudentExamWindow = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);

    const [correctCount, setCorrectCount] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [correctAnswer, setCorrectAnswer] = useState({});
    const [quizName, setQuizName] = useState("");
    const [active, setActive] = useState(true);
    const [startTime, setStartTime] = useState();
    const [endTime, setEndTime] = useState();
    const [date, setDate] = useState();
    const [overQuiz, setOverQuiz] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [loading, setLoading] = useState(false);
    const [questionLoading,setQuestionLoading]=useState(false);
    

    useEffect(() => {
        const fetchDecryptedQuestions = async () => {
            if (active) {
                try {
                    setQuestionLoading(true);
                    const response = await axios.post(
                        `${backendUrl}/api/auth/rsa/decryptpaper`,
                        { quizId },
                        { withCredentials: true }
                    );

                    const questionsData = response.data;
                    setQuestions(questionsData);

                    const answers = {};
                    questionsData.forEach((question) => {
                        answers[question.questionId] = question.correctAnswer;
                    });
                    setCorrectAnswer(answers);

                } catch (error) {
                    console.error("Failed to decrypt quiz paper:", error);
                }
                finally{
                    setQuestionLoading(false);
                }
            }
        };

        fetchDecryptedQuestions();
    }, [active]);


    const handleOptionSelect = (questionId, selectedOption) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: selectedOption,
        }));
    };
    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const res = await axios.get(
                    `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
                    { withCredentials: true }
                );
                console.log("dadadad", res.data);
                setQuizName(res.data.quizName);
                // setQuestions(res.data.questions || []);
                setActive(res.data.isActive);
                setStartTime(res.data.startTime);
                setEndTime(res.data.endTime);
                setDate(res.data.date);

                startTimer(res.data.date, res.data.startTime, res.data.endTime);
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
        };

        fetchQuizData(); // call the async function
    }, [quizId]);
    const startTimer = (date, startTime, endTime) => {
        const interval = setInterval(() => {
            const now = moment().tz("Asia/Kolkata");
            const quizStartTime = moment.tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
            const quizEndTime = moment.tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
            const timeUntilStart = moment.duration(quizStartTime.diff(now));
            const timeUntilEnd = moment.duration(quizEndTime.diff(now));

            if (timeUntilStart.asSeconds() > 0) {
                setTimeLeft(`Quiz starts in: ${timeUntilStart.hours()}h ${timeUntilStart.minutes()}m ${timeUntilStart.seconds()}s`);
            } else if (timeUntilEnd.asSeconds() > 0) {
                setActive(true);
                setTimeLeft(`Time left: ${timeUntilEnd.hours()}h ${timeUntilEnd.minutes()}m ${timeUntilEnd.seconds()}s`);
            } else {
                setTimeLeft("Time Over!");
                setOverQuiz(true);
                clearInterval(interval);
            }
        }, 1000);
    };


    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit the quiz?")) return;

        try {

            setLoading(true);
            let correctCountTemp = 0;

            // console.log("res",res);

            const updatedQuestions = questions.map((q) => {
                const isCorrect = responses[q.questionId] === correctAnswer[q.questionId];
                console.log(responses[q.questionId], correctAnswer[q.questionId]);

                if (isCorrect) correctCountTemp++;

                return { ...q, isCorrect, "selectedOption": responses[q.questionId] };
            });


            console.log(updatedQuestions);

            // for (const key of Object.keys(responses)) {


            // //  console.log(res.data.id,key,responses[key],isCorrect)
            //     try {
            //         await axios.post(
            //             `${backendUrl}/api/auth/teacher/homepage/createresponse?quizId=${quizId}`,
            //             {
            //                 // attemptId: res.data.id,
            //                 questionId: key,
            //                 selectedAnswer: responses[key],
            //                 isCorrect: isCorrect,
            //             },
            //             { withCredentials: true }
            //         );
            //     } catch (e) {
            //         console.log(`Error submitting response for ${key}:`, e);
            //     }
            // }

            setCorrectCount(correctCountTemp);



            // await axios.put(
            //     `${backendUrl}/api/auth/teacher/homepage/updateattempt`,
            //     { attemptId: res.data.id, score: correctCountTemp },
            //     { withCredentials: true }
            // );

            try {
                await axios.post(`${backendUrl}/api/auth/rsa/uploadresponse`, {
                    quizId,
                    studentId: currentUser.id,
                    response: updatedQuestions
                }, { withCredentials: true });

                console.log("Responses uploaded successfully.");
            } catch (error) {
                console.error("Failed to upload responses:", error.response?.data || error.message);
            }

            try {
                await axios.post(
                    `${backendUrl}/api/auth/rsa/addstudentscore`,
                    {
                        quizId,
                        studentId: currentUser.id,
                        score: correctCountTemp,
                    },
                    { withCredentials: true }
                );

                console.log("Score is added to chain");
            } catch (error) {
                console.error("Error posting score:", error);
            }
            try {
                await axios.post(
                    `${backendUrl}/api/auth/rsa/storequizscore`,
                    {
                        quizId,
                        quizName,
                        studentId: currentUser.id,
                        score: correctCountTemp,
                    },
                    { withCredentials: true }
                );

                console.log("Score is added to quizScore struct");
            } catch (error) {
                console.error("Error posting score:", error);
            }

            alert("Quiz Submitted Successfully!");
            navigate(`/student/result/${quizId}/${currentUser.id}/false`);
        } catch (error) {
            console.error("Error submitting quiz:", error);
        }
        finally{
            setLoading(false);
        }
    };

    if (!active) {
        return (
            <div className="flex justify-center items-center h-screen flex-col  bg-gradient-to-br from-gray-900 to-black text-white">
                <h2 className="text-2xl font-bold text-red-600">This quiz is not active yet!</h2>
                <h2 className="text-lg font-bold">{timeLeft}</h2>
            </div>
        );
    }

    if (overQuiz) {
        return (
            <div className="flex justify-center items-center h-screen flex-col bg-gradient-to-br from-gray-900 to-black text-white">
                <h2 className="text-2xl font-bold text-red-600">Quiz Over!</h2>
                <h2 className="text-lg font-bold">Your responses have been submitted.</h2>
            </div>
        );
    }
    const currentQuestion = questions[currentQuestionIndex];

    return (
<div className="w-full  relative">
        {loading && (
            
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
            <ClipLoader color="#36d7b7" size={60} />
          </div>
           )}
        <div className="exam-container flex flex-col h-screen bg-blue-950 bg-gradient-to-br from-gray-900 to-black text-white">
            <div className="flex justify-between items-center px-6 py-3 bg-gray-800">
                <h2 className="text-lg font-bold">{quizName}</h2>
                <h2 className="text-lg font-bold">{timeLeft}</h2>
                <h2 className="text-lg font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                <button
                    className="quiz-button bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={handleSubmit}
                >
                    Submit
                </button>
            </div>

            <div className="flex flex-1">
                {/* Navigation Panel */}
                <div className="w-1/4 p-4 border-r bg-gray-800 space-y-3">
                    <h2 className="text-xl font-bold mb-4">Quiz Navigation</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, i) => (
                            <button
                                key={q.questionId}
                                className={`p-2 text-white rounded ${responses[q.questionId] ? "bg-green-500" : "bg-gray-500"}`}
                                onClick={() => setCurrentQuestionIndex(i)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-3/4 p-6 flex flex-col overflow-auto h-[90vh]">
                    {currentQuestion ? (
                        <>
                       
                            <h2 className="text-xl font-bold mb-2">Question {currentQuestionIndex + 1}</h2>
                            <p className="mb-4 text-lg">{currentQuestion.question}</p>

                            {/* Images */}
                            <div className="flex flex-wrap">
                                {currentQuestion.images?.map((image, index) => (
                                    <ImagePopup key={index} index={index} image_url={image} />
                                ))}
                            </div>

                            {/* Options */}
                            <div className="options space-y-3 mt-4">
                                {["optionA", "optionB", "optionC", "optionD"].map((optionKey) => (
                                    <button
                                        key={optionKey}
                                        className={`w-full p-3 text-left border rounded-md text-black transition duration-300 ease-in-out hover:bg-gradient-to-r from-green-600 to-green-800 ${responses[currentQuestion.questionId] === currentQuestion[optionKey]
                                                ? "bg-gradient-to-r from-green-600 to-green-800 text-white"
                                                : "bg-white"
                                            }`}
                                        onClick={() => handleOptionSelect(currentQuestion.questionId, currentQuestion[optionKey])}
                                    >
                                        {currentQuestion[optionKey]}
                                    </button>
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-6">
                                <button
                                    className={`px-6 py-3 rounded-lg font-semibold text-white transition duration-300 ease-in-out shadow-md ${currentQuestionIndex === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-purple-600 hover:bg-purple-700 active:scale-95 focus:ring-2 focus:ring-purple-400"
                                        }`}
                                    disabled={currentQuestionIndex === 0}
                                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                >
                                    Previous
                                </button>

                                <button
                                    className={`px-6 py-3 rounded-lg font-semibold text-white transition duration-300 ease-in-out shadow-md ${currentQuestionIndex === questions.length - 1
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-400"
                                        }`}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    ) : (
                        <StudentExamWindowSkalaton></StudentExamWindowSkalaton>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
};

export default StudentExamWindow;