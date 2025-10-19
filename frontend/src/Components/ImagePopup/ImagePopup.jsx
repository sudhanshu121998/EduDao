import { useState } from "react";

const ImagePopup = ({ image_url, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOnClick = () => {
        console.log("hello");
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="relative">
            {/* Thumbnail Image */}
            <div onClick={handleOnClick}>
                <img
                    key={index}
                    src={image_url}
                    alt={`Image ${index + 1}`}
                    className="h-72 object-cover rounded-md border m-5 cursor-pointer"
                />
            </div>

            {/* Fullscreen Popup */}
            {isOpen && (
                <div
                    onClick={handleOnClick}
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
                >
                    <img
                        className="max-h-[90vh] max-w-[90vw] rounded-md"
                        src={image_url}
                        alt={`Image ${index + 1}`}
                    />
                </div>
            )}
        </div>
    );
};

export default ImagePopup;