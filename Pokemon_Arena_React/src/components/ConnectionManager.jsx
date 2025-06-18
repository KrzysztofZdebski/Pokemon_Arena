import React from 'react';
import { socket } from '../utils/socket';

export function ConnectionManager() {
  function connect() {
    console.log('Connecting to socket...');
    socket.connect();
  }

  function disconnect() {
    console.log('Disconnecting from socket...');
    socket.disconnect();
  }

  return (
    <>
      <button onClick={ connect }>Connect</button>
      <button onClick={ disconnect }>Disconnect</button>
    </>
  );
}