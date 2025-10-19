const QuestionSkeleton = () => {
    return (
        <div className="mb-6 p-4 border-b border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            {[1, 2, 3, 4].map((_, idx) => (
                <div key={idx} className="h-4 bg-gray-600 rounded w-full mb-2"></div>
            ))}
            <div className="h-4 bg-gray-700 rounded w-1/3 mt-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3 mt-2"></div>
        </div>
    );
};

export default QuestionSkeleton;