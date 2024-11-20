import 'react-native-reanimated'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RecordingProvider } from './src/screens/RecordingContext';
import Home from './src/screens/Home';
import Library from './src/screens/Library';
import Record from './src/screens/Record';
import Export from './src/screens/Export';
import { useFonts, WorkSans_700Bold } from '@expo-google-fonts/work-sans';
import AppLoading from 'expo-app-loading';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import './global.css'

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
    const [fontsLoaded] = useFonts({
        WorkSans: WorkSans_700Bold,
    });

    if (!fontsLoaded) {
        return <AppLoading />;
    }

    return (
        <RecordingProvider>
             <StatusBar style="light" />
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName;

                            if (route.name === 'Home') {
                                iconName = focused ? 'home' : 'home-outline';
                            } else if (route.name === 'Library') {
                                iconName = focused ? 'library' : 'library-outline';
                            } else if (route.name === 'Record') {
                                iconName = focused ? 'mic' : 'mic-outline';
                            } else if (route.name === 'Export') {
                                iconName = focused ? 'share' : 'share-outline';
                            }

                            return <Ionicons name={iconName} size={size} color={color} />;
                        },
                        tabBarActiveTintColor: '#ffffff',
                        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
                        tabBarLabelStyle: {
                            fontFamily: 'WorkSans',
                            fontSize: 12,
                        },
                        tabBarStyle: {
                            backgroundColor: '#121212',
                            borderTopWidth: 0,
                        },
                    })}
                >
                    <Tab.Screen 
                        name="Home" 
                        component={Home}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Tab.Screen 
                        name="Library" 
                        component={Library}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Tab.Screen 
                        name="Record" 
                        component={Record}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Tab.Screen 
                        name="Export" 
                        component={Export}
                        options={{
                            headerShown: false,
                        }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </RecordingProvider>
    );
};

export default App;