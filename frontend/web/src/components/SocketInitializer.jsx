import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { initSocket, disconnectSocket } from '@instachat/shared';

export default function SocketInitializer() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      initSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?._id]);

  return null;
}
