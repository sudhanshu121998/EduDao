import cron from "node-cron";
import prisma from "../../../lib/prisma.js"; 
import moment from "moment-timezone"; // ✅ Import moment-timezone for IST conversion

const updateQuizStatus = async () => {
    try {
        // ✅ Get current date & time in IST (India Standard Time) (Without Seconds)
        const currentISTTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm");
        const str="T00:00:00.000+00:00"

        console.log(`⏳ Checking quizzes at IST time: ${currentISTTime}`);

        // ✅ Activate quizzes at the exact scheduled time (IST)
        const activateQuizzes = await prisma.quiz.updateMany({
            where: {
                date: (currentISTTime.split(" ")[0]+str), // ✅ Ensure correct date (YYYY-MM-DD)
                startTime: currentISTTime.split(" ")[1], // ✅ Ensure correct time (HH:mm)
                isActive: false,
            },
            data: { isActive: true }
        });

        // ✅ Deactivate quizzes at the scheduled end time (IST)
        const deactivateQuizzes = await prisma.quiz.updateMany({
            where: {
                date: currentISTTime.split(" ")[0]+str, // ✅ Ensure correct date (YYYY-MM-DD)
                endTime: currentISTTime.split(" ")[1], // ✅ Ensure correct time (HH:mm)
                isActive: true,
            },
            data: { isActive: false }
        });

        console.log(`✅ Quiz Status Updated: Activated - ${activateQuizzes.count}, Deactivated - ${deactivateQuizzes.count}`);
    } catch (error) {
        console.error("❌ Error updating quiz status:", error);
    }
};

// **Schedule to run every minute (IST)**
cron.schedule("* * * * *", updateQuizStatus);

console.log("🚀 Quiz Scheduler Started: Running every minute (IST).");

export default updateQuizStatus;