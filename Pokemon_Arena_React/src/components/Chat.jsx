import React, { useEffect } from "react";

export function Chat({ messages }) {
    useEffect(() => {
        console.log(messages);
    }, [messages]);

    return (
        <div className="ml-10 chat-container">
        <div className="chat-messages">
            {messages.map((message, index) => (
            <div key={index} className="chat-message">
                <span className="chat-username">{message.username}: </span>
                <span className="chat-text">{message.text}</span>
            </div>
            ))}
        </div>
        </div>
    );
}