import React from 'react';

export function ConnectionManager({socket}) {
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