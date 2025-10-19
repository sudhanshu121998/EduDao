const StudentExamWindowSkalaton = () => {
    return (
        <div className="animate-pulse space-y-6 p-4 rounded-lg bg-gray-800">
            {/* Question heading */}
            <div className="h-6 bg-gray-700 rounded w-1/3" />

            {/* Question text */}
            <div className="h-4 bg-gray-700 rounded w-2/3" />

            {/* Image thumbnails */}
            <div className="flex gap-4 mt-4">
                <div className="w-24 h-24 bg-gray-700 rounded-md" />
                <div className="w-24 h-24 bg-gray-700 rounded-md" />
                <div className="w-24 h-24 bg-gray-700 rounded-md" />
            </div>

            {/* Options */}
            <div className="space-y-3 mt-6">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="h-12 bg-gray-700 rounded w-full" />
                ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
                <div className="h-10 w-28 bg-gray-700 rounded" />
                <div className="h-10 w-28 bg-gray-700 rounded" />
            </div>
        </div>
    );
};

export default StudentExamWindowSkalaton;