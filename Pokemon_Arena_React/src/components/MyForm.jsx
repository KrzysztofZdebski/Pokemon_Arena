import React, { useState,useContext } from 'react';
import AuthContext from '../utils/authProvider';

export function MyForm({socket}) {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {username} = useContext(AuthContext);

  function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    socket.emit('send_text', {"message" : value, "username" : username}, () => {
      setIsLoading(false);
    });
  }

  return (
    <form onSubmit={ onSubmit }>
      <input onChange={ e => setValue(e.target.value) } />

      <button type="submit" disabled={ isLoading }>Submit</button>
    </form>
  );
}