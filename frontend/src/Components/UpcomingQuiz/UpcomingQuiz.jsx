import { useEffect, useState } from "react";
import moment from "moment-timezone";
const backendUrl = import.meta.env.VITE_BACKEND_URL_PRODUCTION || import.meta.env.VITE_BACKEND_URL_LOCAL;

const UpcomingQuiz = ({ quizName, date, startTime, endTime }) => {
    const [remainingTime, setRemainingTime] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = moment().tz("Asia/Kolkata");
            const quizStartTime = moment.tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
            const quizEndTime = moment.tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");

            const diff = moment.duration(quizStartTime.diff(now));
            const diff1 = moment.duration(quizEndTime.diff(now));

            if (diff.asSeconds() > 0 && diff1.asSeconds() > 0) {
                setRemainingTime(`${diff.hours()}h ${diff.minutes()}m ${diff.seconds()}s`);
            } else if (diff.asSeconds() <= 0 && diff1.asSeconds() > 0) {
                setRemainingTime("Quiz is Live!");

            }
            else if (diff.asSeconds() < 0 && diff1.asSeconds() <= 0) {
                setRemainingTime("Quiz Ended!");
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [date, startTime]);

    return (
        <div>
            <div className="border-black border-solid border-2 m-4 flex flex-col justify-center text-center h-72">
                <div className="text-xl font-bold">{quizName}</div>
                <div className="text-lg text-blue-600">Live at {startTime} IST</div>
                <div className="text-red-500 text-2xl">{remainingTime}</div>
            </div>
        </div>
    );
};

export default UpcomingQuiz;