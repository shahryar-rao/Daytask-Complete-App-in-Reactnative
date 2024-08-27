// hooks/useFonts.js
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';

const useFonts = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        const loadFonts = async () => {
            try {
                await Font.loadAsync({
                    'Pilatextended': require('../../../assets/fonts/PilatExtended-DemiBold.ttf'),
                });
                setFontsLoaded(true);
            } catch (error) {
                console.error('Error loading fonts', error);
            }
        };

        loadFonts();
    }, []);

    return fontsLoaded;
};

export default useFonts;
