export function ConnectionManager({socket}) {

  function connect() {
    if (!socket) {
      console.log('No socket available to connect');
      return;
    }
    console.log('Connecting to socket...');
    socket.connect();
  }

  function disconnect() {
    if (!socket) {
      console.log('No socket available to disconnect');
      return;
    }
    console.log('Disconnecting from socket...');
    socket.disconnect();
  }

  return (
    <>
      <button onClick={connect} disabled={!socket}>Connect</button>
      <button onClick={disconnect} disabled={!socket}>Disconnect</button>
    </>
  );
}