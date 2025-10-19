import { useState, useEffect, useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import axios from "axios";
import UpcomingQuiz from "../../Components/UpcomingQuiz/UpcomingQuiz";
import CreateQuiz from "../CreateQuiz/CreateQuiz";
import TeacherHomePageLeft from "../../Components/TeacherHomePageLeft/TeacherHomePageLeft";
import moment from "moment-timezone";
import { AuthContext } from "../../../lib/authContext/AuthContext";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL_PRODUCTION ||
  import.meta.env.VITE_BACKEND_URL_LOCAL;

const TeacherHomePage = () => {
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/auth/teacher/homepage/getquiz?teacherId=${currentUser.id}`,
          { withCredentials: true }
        );
        setQuizzes(res.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };

    fetchQuizzes();
  }, []);

  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const now = moment().tz("Asia/Kolkata");
    const startA = moment.tz(`${a.date} ${a.startTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const endA = moment.tz(`${a.date} ${a.endTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    const startB = moment.tz(`${b.date} ${b.startTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    const endB = moment.tz(`${b.date} ${b.endTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

    const isLiveA = now.isBetween(startA, endA);
    const isLiveB = now.isBetween(startB, endB);

    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;
    if (isLiveA && isLiveB) return endA.diff(endB);
    if (startA.isAfter(now) && startB.isAfter(now)) return startA.diff(startB);
    return endB.diff(endA);
  });

  const handleShowCreateQuiz = () => setShowCreateQuiz(true);
  const handleHideCreateQuiz = () => setShowCreateQuiz(false);

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/teacher/logout`, {}, { withCredentials: true });
      setCurrentUser(null);
      navigate("/teacher/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="p-4 h-full w-full relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <Link to="/">
          <img
            src="/quiz.jpg"
            alt="Quiz Logo"
            className="h-14 md:h-16 hover:scale-105 transition-all"
          />
        </Link>
        <div className="flex justify-end items-center space-x-4">
          <img
            src="/plus.jpg"
            alt="Create Quiz"
            className="size-10 md:size-12 cursor-pointer hover:scale-110 transition-all"
            onClick={handleShowCreateQuiz}
          />
          <img
            src="/Avatar.jpg"
            alt="User Avatar"
            className="size-10 md:size-12 rounded-full cursor-pointer border-2 border-gray-500 hover:border-white transition-all"
            onClick={() => setDropdownOpen((prev) => !prev)}
          />
          {dropdownOpen && (
            <div className="absolute right-10 top-20 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-5rem)] w-full space-x-4">
        {/* Left Panel - Created Quizzes (Reduced Width) */}
        <div className="left w-60 border border-gray-700 rounded-lg bg-gray-800 p-4 overflow-auto">
          <div className="flex items-center justify-between text-lg font-semibold mb-2 text-white">
            <span>Created Quizzes</span>
            <img
              src="/plus.jpg"
              className="size-8 cursor-pointer hover:scale-110 transition-all"
              onClick={handleShowCreateQuiz}
            />
          </div>
          <TeacherHomePageLeft />
        </div>

        {/* Middle Panel (More Space) */}
        <div className={`middle flex-grow flex flex-col overflow-auto rounded-lg ${showCreateQuiz ? "justify-center items-center" : "items-center"}`}>
          <Outlet />
          {showCreateQuiz && <CreateQuiz onClose={handleHideCreateQuiz} setShowCreateQuiz={setShowCreateQuiz} />}
        </div>

        {/* Right Panel - Upcoming Quizzes (Reduced Width & Improved Text Color) */}
        <div className="right w-60 border border-gray-700 rounded-lg bg-gray-800 p-4 overflow-auto">
          <div className="text-lg font-semibold mb-2 text-white">Upcoming Quizzes</div>
          {quizzes.length > 0 ? (
            sortedQuizzes.map((quiz) => (
              <UpcomingQuiz
                key={quiz.id}
                quizName={quiz.quizName}
                date={quiz.date}
                startTime={quiz.startTime}
                endTime={quiz.endTime}
                className="text-gray-200"
              />
            ))
          ) : (
            <p className="text-center text-gray-300">No upcoming quizzes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHomePage;
