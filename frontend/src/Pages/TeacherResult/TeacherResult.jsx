import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const TeacherResult = () => {
    const { quizId } = useParams();
    const [quizName, setQuizName] = useState("");
    // const [attempts, setAttempts] = useState([]);
    const [studentResults, setStudentResults]=useState([]);
    const navigate = useNavigate();

    // useEffect(() => {
    //     const fetchQuiz = async () => {
    //         try {
    //             const res = await axios.get(
    //                 `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
    //                 { withCredentials: true }
    //             );

    //             setQuizName(res.data.quizName);

    //             // Fetch student names for each attempt
    //             const attemptsWithNames = await Promise.all(
    //                 res.data.attempts.map(async (attempt) => {
    //                     try {
    //                         const studentRes = await axios.get(
    //                             `${backendUrl}/api/auth/student/getstudentbyid?studentId=${attempt.studentId}`,
    //                             { withCredentials: true }
    //                         );

    //                         return {
    //                             ...attempt,
    //                             studentName: studentRes.data.name || "Unknown",
    //                         };
    //                     } catch (error) {
    //                         console.error("Error fetching student details:", error);
    //                         return { ...attempt, studentName: "Unknown" };
    //                     }
    //                 })
    //             );

    //             console.log("Resolved Attempts:", attemptsWithNames);
    //             setAttempts(attemptsWithNames);
    //         } catch (error) {
    //             console.error("Error fetching quiz:", error);
    //         }
    //     };

    //     fetchQuiz();
    // }, [quizId]);
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await axios.get(
                    `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
                    { withCredentials: true }
                );

                setQuizName(res.data.quizName);

                // Fetch student names for each attempt
               

               
            } catch (error) {
                console.error("Error fetching quiz:", error);
            }

            try{
                const res=await axios.post(`${backendUrl}/api/auth/rsa/showstudentscore`,{
                    quizId
                },{withCredentials:true});

                console.log(res.data);
                setStudentResults(res.data);
            }
            catch(e){
             console.log("error in fetching student results from chain", e);
            }
        };

        fetchQuiz();
    }, [quizId]);

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-100">{quizName} - Student Results</h1>

            {studentResults.length > 0 ? (
                <table className="w-full border-collapse border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-gray-800 text-gray-200">
                            <th className="border border-gray-700 px-4 py-3">Student ID</th>
                            {/* <th className="border border-gray-700 px-4 py-3">Student Name</th> */}
                             <th className="border border-gray-700 px-4 py-3">Score</th>
                            {/*<th className="border border-gray-700 px-4 py-3">Submitted</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {studentResults.map((attempt, index) => (
                            <tr 
                                key={index} 
                                className="text-center bg-gray-800 hover:bg-gray-700 transition duration-300 cursor-pointer"
                                onClick={() => navigate(`/student/result/${quizId}/${attempt.studentId}/true`)}
                            >
                                <td className="border border-gray-700 px-4 py-3">{attempt.studentId}</td>
                                {/* <td className="border border-gray-700 px-4 py-3">{attempt.studentName}</td> */}
                                <td className="border border-gray-700 px-4 py-3">{attempt.score}</td>
                                {/* <td className="border border-gray-700 px-4 py-3">
                                    {attempt.submitted ? "✅ Yes" : "❌ No"}
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-gray-400 mt-4">No students have attempted this quiz yet.</p>
            )}
        </div>
    );
};

export default TeacherResult;
