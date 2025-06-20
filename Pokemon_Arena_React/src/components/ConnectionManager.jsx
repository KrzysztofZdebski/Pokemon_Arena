import React, {useContext} from 'react';
import AuthContext from '../utils/authProvider';

export function ConnectionManager({socket}) {
  const {username, authToken} = useContext(AuthContext);

  function connect() {
    if (!socket) {
      console.log('No socket available to connect');
      return;
    }
    console.log('Connecting to socket...');
    socket.connect(authToken);
  }

  function disconnect() {
    if (!socket) {
      console.log('No socket available to disconnect');
      return;
    }
    console.log('Disconnecting from socket...');
    socket.disconnect();
  }

  function joinQueue() {
    if (!socket) {
      console.log('No socket available to join queue');
      return;
    }
    console.log('Joining queue...');
    socket.emit('join_queue', {"username" : username});
  }

  return (
    <>
      <button onClick={connect} disabled={!socket}>Connect</button>
      <button onClick={disconnect} disabled={!socket}>Disconnect</button>
      <button onClick={joinQueue} disabled={!socket}>Join Queue</button>
    </>
  );
}