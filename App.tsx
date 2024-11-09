import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RecordingProvider } from './src/screens/RecordingContext';
import Home from './src/screens/Home';
import Library from './src/screens/Library';
import Record from './src/screens/Record';
import Export from './src/screens/Export';
import { useFonts, WorkSans_700Bold } from '@expo-google-fonts/work-sans';  // Use the 700 weight
import AppLoading from 'expo-app-loading';
import './global.css'

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
    const [fontsLoaded] = useFonts({
        WorkSans: WorkSans_700Bold,  // Load Work Sans 700
    });

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <RecordingProvider>
            <NavigationContainer>
                <Tab.Navigator>
                    <Tab.Screen name="Home" component={Home} />
                    <Tab.Screen name="Library" component={Library} />
                    <Tab.Screen name="Record" component={Record} />
                    <Tab.Screen name="Export" component={Export} />
                </Tab.Navigator>
            </NavigationContainer>
        </RecordingProvider>
    );
};

export default App;
