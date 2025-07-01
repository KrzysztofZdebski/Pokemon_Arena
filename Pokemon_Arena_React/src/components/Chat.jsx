import React, { useEffect, useContext, useRef } from "react";
import AuthContext from "../utils/authProvider";

export function Chat({ messages, className = "", socket }) {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        console.log(messages);
    }, [messages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'instant'
            });
        }
    };

    const { username } = useContext(AuthContext);

    const sendMessage = (message) => {
        if (!message || message.trim() === '') return;
        
        // Use the socketService emit method
        if (socket && socket.emit) {
            socket.emit('send_text', {"message": message, "username": username});
        }
    }
// TODO: chat widow changes size
    return (
        <div className={`flex flex-col max-w-lg p-1 mx-auto rounded-sm bg-chat-tan chat-container ${className}`}>
            <div className="flex flex-col flex-1 w-full p-2 mx-auto overflow-hidden font-bold text-left border-4 text-md border-chat-orange bg-chat-yellow">
                <div ref={messagesContainerRef} className="flex-1 mb-2 overflow-y-auto chat-messages">
                    {messages.map((message, index) => (
                        <div key={index} className="break-words chat-message">
                            <span className="text-black chat-username">{message.username}: </span>
                            <span className="text-gray-600 break-words chat-text">{message.text}</span>
                        </div>
                    ))}
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 text-gray-600 border-4 rounded-md bg-chat-tan border-chat-orange focus:outline-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                                sendMessage(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                    <button
                        className="h-full px-4 py-2 ml-2 text-lg font-semibold border-4 rounded-md cursor-pointer border-chat-orange chat-send-button focus:outline-none"
                        onClick={() => {
                            const input = document.querySelector('.chat-container input');
                            sendMessage(input.value);
                            input.value = '';
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}