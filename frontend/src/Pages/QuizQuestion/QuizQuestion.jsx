import { useEffect, useState } from "react";
import Question from "../../Components/Question/Question";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ClipLoader } from "react-spinners";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const QuizQuestion = () => {
  const { quizId, startTime, date } = useParams();
  const [quizName, setQuizName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ loader state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/auth/teacher/homepage/getquizbyid?quizId=${quizId}`,
          { withCredentials: true }
        );
        setQuizName(res.data.quizName);
        setQuestions(res.data.questions || []);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "⚠️ Once you click on submit, you will NOT be able to edit or view the question paper again.\nDo you want to continue?"
    );

    if (confirmed) {
      try {
        setLoading(true); // ✅ show loader
        const dateUpdated = date.split("T")[0];
        await axios.post(
          `${backendUrl}/api/auth/rsa/encryptpaper`,
          {
            questions: finalQuestions,
            quizId,
            startTime,
            date: dateUpdated,
          },
          {
            withCredentials: true,
          }
        );
        alert("Submitted successfully");
        navigate("/teacher/homepage")
      } catch (err) {
        console.error("Submission failed:", err);
        alert("Submission failed!");
      } finally {
        setLoading(false); // ✅ hide loader
      }
    }
  };

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/auth/teacher/homepage/updatequizname?quizId=${quizId}`,
        { quizName },
        { withCredentials: true }
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating quiz name:", error);
    }
  };

  const addQuestion = () => {
    const newQuestion = { questionId: Date.now() };
    setFinalQuestions((prev) => [...prev, newQuestion]);
  };

  return (
    <div className="w-full p-3 relative">
      {loading && (
       <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
       <ClipLoader color="#36d7b7" size={60} />
     </div>
      )}

      <div className="quizName border-solid border-black border-2 w-full h-40 rounded-2xl p-4">
        <h1 className="font-bold text-4xl my-4">Quiz Name</h1>
        {isEditing ? (
          <textarea
            className="w-full h-14 p-2 border border-gray-300 rounded-md text-black placeholder-gray-400"
            rows={3}
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="Enter quiz name"
          />
        ) : (
          <p className="text-lg font-medium">{quizName || "No name set"}</p>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        {isEditing ? (
          <button className="h-10 w-20 bg-green-500 text-white rounded-md" onClick={handleSaveClick}>
            Save
          </button>
        ) : (
          <button className="h-10 w-20 bg-blue-500 text-white rounded-md" onClick={handleEditClick}>
            Edit
          </button>
        )}

        <button
          className="h-10 w-28 bg-green-500 text-white rounded-md"
          onClick={() => navigate(`/teacher/homepage/quizresult/${quizId}`)}
        >
          View Result
        </button>
      </div>

      <div className="questions overflow-auto">
        {finalQuestions.map((question) => (
          <Question
            uploadedImage={question.images}
            key={question.fakeId}
            divId={question.id}
            addDiv={addQuestion}
            editQuestion={question}
            setFinalQuestions={setFinalQuestions}
            finalQuestions={finalQuestions}
          />
        ))}

        <div className="flex items-center justify-center">
          <button className="h-10 w-36 bg-green-500 m-4" onClick={addQuestion}>
            Add Question
          </button>
          <button className="h-10 w-36 bg-green-500 m-4" onClick={handleSubmit}>
            Final Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;