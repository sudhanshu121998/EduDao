import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import HomePage from './Pages/HomePage/HomePage.jsx';
import TeacherStudentCard from './Components/TeacherStudentCard.jsx/TeacherStudentCard.jsx';
import TeacherSignUp from './Components/TeacherSignUp/TeacherSignUp.jsx';
import TeacherSignIn from './Components/TeacherSignIn/TeacherSignIn.jsx';
import TeacherHomePage from './Pages/TeacherHomePage/TeacherHomePage.jsx';
import CreateQuiz from './Pages/CreateQuiz/CreateQuiz.jsx';
import QuizBarGraph from './Components/QuizBarGraph/QuizBarGraph.jsx';
import QuizQuestion from './Pages/QuizQuestion/QuizQuestion.jsx';
import { AuthContextProvider } from '../lib/authContext/AuthContext.jsx';
import { RequireAuth } from './Pages/RequireAuth/RequireAuth.jsx';

import StudentSignUpPage from './studentPage/SignUpPage/StudentSignUpPage.jsx';
import StudentSignInPage from './studentPage/studentSignInPage/StudentSignInPage.jsx';
import StudentExamWindow from './studentPage/studentExamWindow/StudentExamWindow.jsx';
import StudentResult from './studentPage/StudentResult/StudentResult.jsx';
import StudentHomePage from './studentPage/StudentHomePage/StudentHomePage.jsx';
import { StudentRequireAuth } from './Pages/RequireAuth/StudentRequireAuth.jsx';
import TeacherResult from './Pages/TeacherResult/TeacherResult.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        path: "/",
        element: <TeacherStudentCard />
      },
      {
        path: "/teacher/register",
        element: <TeacherSignUp />
      },
      {
        path: "/teacher/signin",
        element: <TeacherSignIn />
      },
      {
        path: "/student/register",
        element: <StudentSignUpPage />
      },
      {
        path: "/student/signin",
        element: <StudentSignInPage />
      }
    ]
  },

  // Protected Routes for Teachers
  {
    path: "/teacher/",
    element: <RequireAuth />, // ✅ Require authentication for teachers
    children: [
      {
        path: "/teacher/",
        element: <TeacherHomePage />,
        children: [
          {
            path: "/teacher/homepage/",
            element: <QuizBarGraph />
          },
          {
            path: "/teacher/homepage/quizquestion/:quizId/:startTime/:date",
            element: <QuizQuestion />
          },
          {
            path: "/teacher/homepage/quizresult/:quizId",
            element: <TeacherResult />
          }
        ]
      },
      {
        path: "/teacher/createquiz",
        element: <CreateQuiz />
      }
    ]
  },

  // ✅ Protected Routes for Students
  {
    path: "/student/",
    element: <StudentRequireAuth />, // ✅ Require authentication for students
    children: [
      {
        path: "/student/homepage",
        element: <StudentHomePage />
      },
      {
        path: "/student/quiz/:quizId",
        element: <StudentExamWindow />
      },
      {
        path: "/student/result/:quizId/:studentId/:isteacher",
        element: <StudentResult />
      }
    ]
  }
]);

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  </StrictMode>
);