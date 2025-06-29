import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socketService from "../utils/socketService";
import { Chat } from "../components/Chat";
import BattleUI from "../components/BattleUI";

export default function Combat() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!id) {
            console.error("Combat page requires a valid battle ID");
            return;
        }
        if (!socketService || !socketService.getConnectionStatus()) {
            console.error("Socket service is not connected");
            return;
        }
        socketService.updateCallbacks({
            onReceiveText: (data) => {
            console.log("Received text combat page:", data);
            setMessages(prevMessages => [...prevMessages, data.message]);
        },
        });
    }, [id, messages]);

    return (
        <div className="w-screen min-h-screen mt-20 bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
        <div className="flex flex-row items-center justify-center h-full p-4 mx-auto w-7/10">
            <BattleUI battleId={id} socket={socketService} className="w-3/5"/>
            <Chat messages={messages} className="w-2/5 h-150" socket={socketService} />
        </div>
        </div>
    );
}