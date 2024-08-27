import { useEffect } from 'react';
import { AppState } from 'react-native';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { database, auth } from '../../../firebase';

const useUpdateLastActive = () => {
    useEffect(() => {
        const updateLastActive = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDocRef = doc(database, 'users', currentUser.uid);
                await updateDoc(userDocRef, {
                    lastActive: Timestamp.fromDate(new Date()),
                });
            }
        };

        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
                updateLastActive(); // Update timestamp when app becomes active
            }
        };

        // Update timestamp every minute while app is active
        const interval = setInterval(() => {
            if (AppState.currentState === 'active') {
                updateLastActive();
            }
        }, 60000); // Update every minute

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            clearInterval(interval); // Clean up the interval on unmount
            subscription.remove(); // Clean up subscription
        };
    }, []);
};

export default useUpdateLastActive;
