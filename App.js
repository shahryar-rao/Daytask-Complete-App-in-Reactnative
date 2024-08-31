import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splashscreen from './src/components/splash';
import Login from './src/components/login';
import Signup from './src/components/signup';
import Home from './src/components/Home';
import ForgotPass from './src/components/forgotpass';
import Profile from './src/components/profile';
import Addtask from './src/components/addtask';
import Taskdetail from './src/components/taskdetail';
import Seeallongoing from './src/components/seeallongoing';
import SeeallCompleted from './src/components/seeallcompleted';
import Messages from './src/components/Messages';
import Contacts from './src/components/contacts';
import Chat from './src/components/chat';
import Groups from './src/components/groups';
import Schedule from './src/components/schedule';
import Notification from './src/components/notification';
import useUpdateLastActive from './src/components/helpers/trackactivity';
import UserSignup from './src/components/userSignup';
import CompanyInfo from './src/components/Company';
import CompanyInfoView from './src/components/companyinfo';



const Stack = createNativeStackNavigator();

export default function App() {

  useUpdateLastActive();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splashscreen" component={Splashscreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="UserSignup" component={UserSignup} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ForgotPass" component={ForgotPass} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Addtask" component={Addtask} />
        <Stack.Screen name="Taskdetail" component={Taskdetail} />
        <Stack.Screen name="Seeallongoing" component={Seeallongoing} />
        <Stack.Screen name="SeeallCompleted" component={SeeallCompleted} />
        <Stack.Screen name="Messages" component={Messages} />
        <Stack.Screen name="Contacts" component={Contacts} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Groups" component={Groups} />
        <Stack.Screen name="Schedule" component={Schedule} />
        <Stack.Screen name="Notification" component={Notification} />
        <Stack.Screen name="CompanyInfo" component={CompanyInfo} />
        <Stack.Screen name="CompanyInfoView" component={CompanyInfoView} />



      </Stack.Navigator>
    </NavigationContainer>
  );
}

