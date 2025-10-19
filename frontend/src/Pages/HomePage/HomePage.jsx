import { Link, Outlet } from "react-router-dom";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL_PRODUCTION ||
  import.meta.env.VITE_BACKEND_URL_LOCAL;

const HomePage = () => {
  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Logo with Smooth Hover Effect */}
      
      <Link to="/">
                <img
                    src="/quiz.jpg"
                    alt="Quiz"
                    className="h-20 absolute left-7 top-7 z-50 "
                /></Link>

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
        <div className="title text-5xl font-extrabold text-white drop-shadow-lg transition-all duration-500 ease-in-out hover:text-gray-300 hover:scale-105 hover:drop-shadow-xl">
          ClassQuiz
        </div>
        <div className="tagLine text-2xl mt-3 text-gray-300 italic transition-all duration-500 ease-in-out hover:text-white hover:scale-105">
          Quiz. Learn. Excel!!!
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default HomePage;
