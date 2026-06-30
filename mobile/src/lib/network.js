import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [state, setState] = useState({ isConnected: true, isInternetReachable: true });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((nextState) => {
      setState({
        isConnected: nextState.isConnected !== false,
        isInternetReachable: nextState.isInternetReachable !== false,
      });
    });

    NetInfo.fetch()
      .then((nextState) => {
        setState({
          isConnected: nextState.isConnected !== false,
          isInternetReachable: nextState.isInternetReachable !== false,
        });
      })
      .catch(() => {
        // The subscription will supply the next state. Avoid an unhandled
        // rejection if Android's initial connectivity query is unavailable.
      });

    return unsubscribe;
  }, []);

  return {
    ...state,
    isOffline: state.isConnected === false || state.isInternetReachable === false,
  };
}
