import React, { useEffect } from "react";

export function Chat({ messages, className = "" }) {
    useEffect(() => {
        console.log(messages);
    }, [messages]);

    return (
        <div className={`flex flex-col max-w-lg p-1 mx-auto rounded-sm bg-chat-tan chat-container ${className}`}>
            <div className="flex-1 p-2 mx-auto overflow-hidden text-lg font-bold text-left border-4 border-chat-orange bg-chat-yellow">
                <div className="h-full overflow-y-auto chat-messages">
                    {messages.map((message, index) => (
                        <div key={index} className="break-words chat-message">
                            <span className="text-black chat-username">{message.username}: </span>
                            <span className="text-gray-600 break-all chat-text">{message.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}