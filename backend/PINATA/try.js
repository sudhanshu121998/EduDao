// const StudentExamWindow = () => {
//     const { quizId } = useParams();
//     const navigate = useNavigate();
//     const [questions, setQuestions] = useState([
//         {
//           id: 1,
//           question: "What is the capital of France?",
//           options: ["Berlin", "Madrid", "Paris", "Rome"],
//           correctAnswer: "Paris"
//         }
//       ]);
//     // let questions;
//     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//     const [responses, setResponses] = useState({});
//     const [correctAnswer, setCorrectAnswer] = useState({});
//     const [timeLeft, setTimeLeft] = useState("");
//     const [quizName, setQuizName] = useState("");
//     const [correctCount, setCorrectCount] = useState(0);
//     const [overQuiz, setOverQuiz] = useState(false);
//     const [active, setActive] = useState(false);
    // const [startTime, setStartTime] = useState();
    // const [endTime, setEndTime] = useState();
    // const [date, setDate] = useState();
//     const [image, setImage] = useState([]);
//     const [isOpen, SetIsOpen] = useState(false);


//     const { currentUser } = useContext(AuthContext)

//     let alreadyCheck = false;

//     useEffect(() => {
//         const fetchDecryptedQuestions = async () => {
//             if (active) {
//                 try {
//                     const response = await axios.post(
//                         `${backendUrl}/api/auth/rsa/decryptpaper`,
//                         { quizId },
//                         { withCredentials: true }
//                     );

//                     console.log(response.data);

//                     //  questions = response.data
//                     setQuestions(prev => [...prev, ...response.data]);
//                     // setQuestions(response.data);

//                     //   console.log("questions ",questions)

//                     const answers = {};
//                     response.data.forEach((question) => {
//                         answers[question.id] = question.correctAnswer;
//                     });
//                     setCorrectAnswer(answers);
//                 } catch (error) {
//                     console.error("Failed to decrypt quiz paper:", error);
//                 }
//             }
//         };

//         fetchDecryptedQuestions();
//     }, [active]);



//     useEffect(() => {
//         const fetchQuestions = async () => {


//             try {

//                 const res = await axios.get(
//                     `${backendUrl}/api/auth/student/getstudentbyid?studentId=${currentUser.id}`,
//                     { withCredentials: true }
//                 );

//                 console.log("okkk")

//                 const studentData = res.data; // Extract student data
//                 const quizIdToCheck = quizId; // Replace this with the current quiz ID

//                 // Check if the quizId is already present in the student's attempts
//                 const hasAttempted = studentData.attempts.some(attempt => attempt.quizId === quizIdToCheck);

//                 if (hasAttempted && !alreadyCheck) {
//                     console.log("Student has already attempted this quiz.");
//                     alreadyCheck = true;

//                     alert("You have already attempted this quiz.");
//                     navigate("/student/homepage")
//                     return; // Stop further execution
//                 }

//                 console.log("Student is eligible to take the quiz.");
//             } catch (error) {
//                 console.error("Error fetching student data:", error);
//             }
            // try {
            //     const res = await axios.get(
            //         `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
            //         { withCredentials: true }
            //     );
            //     console.log("dadadad", res.data);
            //     setQuizName(res.data.quizName);
            //     // setQuestions(res.data.questions || []);
            //     setActive(res.data.isActive);
            //     setStartTime(res.data.startTime);
            //     setEndTime(res.data.endTime);
            //     setDate(res.data.date);




            //     startTimer(res.data.date, res.data.startTime, res.data.endTime);
            // } catch (error) {
            //     console.error("Error fetching questions:", error);
            // }
//         };

//         fetchQuestions();
//     }, [quizId]);



    // const startTimer = (date, startTime, endTime) => {
    //     const interval = setInterval(() => {
    //         const now = moment().tz("Asia/Kolkata");
    //         const quizStartTime = moment.tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    //         const quizEndTime = moment.tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    //         const timeUntilStart = moment.duration(quizStartTime.diff(now));
    //         const timeUntilEnd = moment.duration(quizEndTime.diff(now));

    //         if (timeUntilStart.asSeconds() > 0) {
    //             setTimeLeft(`Quiz starts in: ${timeUntilStart.hours()}h ${timeUntilStart.minutes()}m ${timeUntilStart.seconds()}s`);
    //         } else if (timeUntilEnd.asSeconds() > 0) {
    //             setActive(true);
    //             setTimeLeft(`Time left: ${timeUntilEnd.hours()}h ${timeUntilEnd.minutes()}m ${timeUntilEnd.seconds()}s`);
    //         } else {
    //             setTimeLeft("Time Over!");
    //             setOverQuiz(true);
    //             clearInterval(interval);
    //         }
    //     }, 1000);
    // };


//     const handleOptionSelect = (questionId, selectedOption) => {
//         setResponses((prev) => ({
//             ...prev,
//             [questionId]: selectedOption,
//         }));
//     };

    // const handleSubmit = async () => {
    //     if (!window.confirm("Are you sure you want to submit the quiz?")) return;

    //     console.log("Responses Submitted:", responses);
    //     try {
    //         console.log(currentUser);
    //         const res = await axios.post(
    //             `${backendUrl}/api/auth/teacher/homepage/createattempt?quizId=${quizId}&studentId=${currentUser.id}`,
    //             {},
    //             { withCredentials: true }
    //         );

    //         let correctCountTemp = 0;

    //         for (const key of Object.keys(responses)) {
    //             const isCorrect = responses[key] === correctAnswer[key];
    //             if (isCorrect) correctCountTemp++;

    //             try {
    //                 await axios.post(
    //                     `${backendUrl}/api/auth/teacher/homepage/createresponse?quizId=${quizId}`,
    //                     {
    //                         attemptId: res.data.id,
    //                         questionId: key,
    //                         selectedAnswer: responses[key],
    //                         isCorrect: isCorrect,
    //                     },
    //                     { withCredentials: true }
    //                 );
    //             } catch (e) {
    //                 console.log(`Error submitting response for ${key}:`, e);
    //             }
    //         }

    //         setCorrectCount(correctCountTemp);
    //         await axios.put(
    //             `${backendUrl}/api/auth/teacher/homepage/updateattempt`,
    //             { attemptId: res.data.id, score: correctCountTemp },
    //             { withCredentials: true }
    //         );

    //         alert("Quiz Submitted Successfully!");
    //         navigate(`/student/result/${quizId}/${res.data.id}/false`);
    //     } catch (error) {
    //         console.error("Error submitting quiz:", error);
    //     }
    // };

    // if (!active) {
    //     return (
    //         <div className="flex justify-center items-center h-screen flex-col  bg-gradient-to-br from-gray-900 to-black text-white">
    //             <h2 className="text-2xl font-bold text-red-600">This quiz is not active yet!</h2>
    //             <h2 className="text-lg font-bold">{timeLeft}</h2>
    //         </div>
    //     );
    // }

    // if (overQuiz) {
    //     return (
    //         <div className="flex justify-center items-center h-screen flex-col bg-gradient-to-br from-gray-900 to-black text-white">
    //             <h2 className="text-2xl font-bold text-red-600">Quiz Over!</h2>
    //             <h2 className="text-lg font-bold">Your responses have been submitted.</h2>
    //         </div>
    //     );
    // }


//     if (active) {

//         console.log("questions", questions);


//         const currentQuestion = questions[currentQuestionIndex];




//         return (
//             <div className="exam-container flex flex-col h-screen bg-blue-950 bg-gradient-to-br from-gray-900 to-black text-white">
//                 <div className="flex justify-between items-center px-6 py-3 bg-gray-800">
//                     <h2 className="text-lg font-bold">{timeLeft}</h2>
//                     <h2 className="text-lg font-bold">{quizName}</h2>
//                     {/* <h2 className="text-lg font-bold">Question {currentQuestionIndex + 1} of {questions.length}</h2> */}
                    // <button
                    //     className="quiz-button bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    //     onClick={handleSubmit}
                    // >
                    //     Submit
                    // </button>
//                 </div>

//                 <div className="flex flex-1">
//                     <div className="w-1/4 p-4 border-r bg-gray-800 space-y-3">
//                         <h2 className="text-xl font-bold mb-4">Quiz Navigation</h2>
//                         <div className="grid grid-cols-5 gap-2">
//                             {questions.map((q, i) => (
//                                 <button
//                                     key={q.id}
//                                     className={`p-2 text-white rounded ${responses[q.id] ? "bg-green-500" : "bg-gray-500"}`}
//                                     onClick={() => {
//                                         setCurrentQuestionIndex(i + 1); // +1 to match original index
//                                         console.log(questions);
//                                     }}
//                                 >
//                                     {i + 2} {/* since i starts from 0 in slice(1) */}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="w-3/4 p-6 flex flex-col overflow-auto h-[90vh]">
//                         <h2 className="text-xl font-bold mb-2">Question {currentQuestionIndex + 1}</h2>
//                         <p className="mb-4 text-lg">{currentQuestion.question}</p>
//                         <div className="flex flex-wrap ">
//                             {currentQuestion.images?.map((image, index) => (
//                                 // <img key={index} src={image} alt={`Image ${index + 1}`} className="h-72  object-cover rounded-md border m-5" />
//                                 <ImagePopup index={index} image_url={image}   ></ImagePopup>
//                                 // {console.log(isOpen)}
//                             ))}
//                         </div>

//                         <div className="options space-y-3 ">
//                             {["optionA", "optionB", "optionC", "optionD"].map((optionKey) => (
//                                 <button
//                                     key={optionKey}
//                                     className={`w-full p-3 text-left border rounded-md text-black transition duration-300 ease-in-out hover:bg-gradient-to-r from-green-600 to-green-800 ${responses[currentQuestion.id] === currentQuestion[optionKey]
//                                         ? "bg-gradient-to-r from-green-600 to-green-800 text-white"
//                                         : "bg-white"
//                                         }`}
//                                     onClick={() => handleOptionSelect(currentQuestion.id, currentQuestion[optionKey])}
//                                 >
//                                     {currentQuestion[optionKey]}
//                                 </button>
//                             ))}
//                         </div>

//                         <div className="flex justify-between mt-6">
//                             <button
//                                 className={`px-6 py-3 rounded-lg font-semibold text-white transition duration-300 ease-in-out shadow-md 
//   ${currentQuestionIndex === 0
//                                         ? "bg-gray-400 cursor-not-allowed"
//                                         : "bg-purple-600 hover:bg-purple-700 active:scale-95 focus:ring-2 focus:ring-purple-400"
//                                     }`}
//                                 disabled={currentQuestionIndex === 0}
//                                 onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
//                             >
//                                 Previous
//                             </button>
//                             {/* <button
//                             className="quiz-button bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
//                             onClick={handleSubmit}
//                         >
//                             Submit
//                         </button> */}
//                             <button
//                                 className={`px-6 py-3 rounded-lg font-semibold text-white transition duration-300 ease-in-out shadow-md 
//   ${currentQuestionIndex === questions.length - 1
//                                         ? "bg-gray-400 cursor-not-allowed"
//                                         : "bg-blue-600 hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-400"
//                                     }`}
//                                 disabled={currentQuestionIndex === questions.length - 1}
//                                 onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
//                             >
//                                 Next
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
// };

// export default StudentExamWindow;