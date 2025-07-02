import { React, useEffect, useContext, useRef, useState } from 'react';
import { ConnectionState } from '../components/ConnectionState';
import { ConnectionManager } from '../components/ConnectionManager';
import { Events } from "../components/Events";
import { MyForm } from '../components/MyForm';
import AuthContext from '../utils/authProvider';
import { Chat } from '../components/Chat';
import socketService from '../utils/socketService';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Battle() {
  const { isAuthenticated, authToken, triggerAuthCheck, username } = useContext(AuthContext);
  const socketInitialized = useRef(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);

  useEffect(() => {
    // Reset when auth changes
    if (!isAuthenticated || !authToken) {
      socketInitialized.current = false;
      socketService.disconnect();
      return;
    }

    // Only initialize once per auth session
    if (socketInitialized.current) {
      console.log("Socket already initialized for this auth session");
      return;
    }

    console.log("Initializing socket service");
    socketInitialized.current = true;

    // Initialize socket service with callbacks
    socketService.initialize({
      onMatchFound: (data) => {
        console.log("Match found, navigating to battle page");
        setIsJoiningQueue(false);
        navigate(`/battle/${data.room_id}`);
      },
      onAuthFail: () => {
        setIsJoiningQueue(false);
        triggerAuthCheck();
      },
      onOpponentLeft: (data) => {
        console.log("Opponent left the game:", data);
        setIsJoiningQueue(false);
        navigate('/battle');
      }
    });

    // Connect and set socket for other components
    socketService.connect(authToken);

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, authToken, triggerAuthCheck]);

  useEffect(() => {
    socketService.reconnect(authToken);
  }, [authToken]);

  const navigate = useNavigate();

  const joinQueue = () => {
    setIsJoiningQueue(true);
    socketService.emit('join_queue', {"username" : username});
    console.log("Joining battle queue with username:", username);
  }

  const leaveQueue = () => {
    setIsJoiningQueue(false);
    socketService.emit('leave_queue', {"username" : username});
    console.log("Leaving battle queue");
  }

  return (
    <>
      <div className="lg:w-[99vw] md:w-[99vw] sm:w-[100vw] min-h-screen mt-26 bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
        <div className="container px-6 py-12 mx-auto">
          <header className="mb-16 text-center">
            <h1 className="mb-6 text-5xl font-bold text-white">
              Battle Arena
            </h1>
            <p className="text-xl text-white/80">
              Challenge trainers and their Pokemon!
            </p>
          </header>
          
          {/* <Chat messages={messages} className="mb-10 h-96" socket={socketService} /> */}

          <main className="flex justify-center">
            <div className="w-full max-w-2xl pokemon-card">
              <h2 className="mb-6 text-2xl font-semibold text-center">Choose Your Battle</h2>
              
              <div className="min-h-[400px] flex items-center justify-center">
                {isJoiningQueue ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 mb-6 border-t-4 border-white rounded-full animate-spin"></div>
                    <h3 className="mb-4 text-2xl font-bold">Finding Opponent...</h3>
                    <p className="mb-6 text-gray-400">Please wait while we find you a worthy opponent!</p>
                    <button
                      onClick={leaveQueue}
                      className="px-6 py-3 font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      Leave Queue
                    </button>
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center p-6 text-white transition-shadow bg-red-600 rounded-lg shadow-lg cursor-pointer bg-gradient-to-r hover:bg-red-700" onClick={joinQueue}>
                      <h3 className="mb-2 text-xl font-bold">Quick Battle</h3>
                      <p className="mb-2">Jump into a random battle with your Pokemon!</p>
                      <FontAwesomeIcon icon="fa-solid fa-fist-raised" className="text-2xl" />
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-xl">
                      <h3 className="mb-2 text-xl font-bold">Tournament</h3>
                      <p className="mb-2">In progrss...</p>
                      <FontAwesomeIcon icon="fa-solid fa-person-digging" />
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-green-500 to-green-600 hover:shadow-xl">
                      <h3 className="mb-2 text-xl font-bold">Gym Challenge</h3>
                      <p className="mb-2">In progrss...</p>
                      <FontAwesomeIcon icon="fa-solid fa-person-digging" />
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-xl">
                      <h3 className="mb-2 text-xl font-bold">Elite Four</h3>
                      <p className="mb-2">In progrss...</p>
                      <FontAwesomeIcon icon="fa-solid fa-person-digging" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="App">
        {/* <ConnectionState isConnected={isConnected} /> */}
        {/* <Events events={fooEvents} /> */}
        {/* <ConnectionManager socket={socketService} /> */}
        {/* <MyForm socket={socketService} /> */}
      </div>
    </>
  )
}

export default Battle
