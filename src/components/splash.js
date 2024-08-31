import React,{useState,useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image,Dimensions,TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';




const { width, height } = Dimensions.get('window');

export default function Splashscreen({navigation}) {
    const fontSize = Math.min(width, height) * 0.14;

    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
      const loadFonts = async () => {
        await Font.loadAsync({
          'CustomFont': require('../../assets/fonts/PilatExtended-DemiBold.ttf'),
        });
        setFontsLoaded(true);
      };
  
      loadFonts();
    }, []);
  
    if (!fontsLoaded) {
      return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style='light'/>
            <View>
                <Image source={require("../../assets/logo.png")} style={styles.logo} />
            </View>
            <View style={styles.photocontainer}>
                <Image source={require('../../assets/pana.png')} style={styles.photo} resizeMode="stretch" />
            </View>
            <View style={styles.textcontainer}>
                <Animatable.Text animation={'slideInLeft'} style={styles.text}>Manage your</Animatable.Text>
                  <Animatable.Text  animation={'slideInRight'} style={styles.task}>Task with</Animatable.Text>
                  <Animatable.Text animation={'slideInLeft'} style={styles.task1}>DayTask</Animatable.Text>

            </View>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.buttontext}>Let’s Start</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        // alignItems: 'center',
        // justifyContent: 'center',
        paddingHorizontal:wp('6%'),
    },
    logo: {
        width: wp('30%'),
        height: hp('10%'),
    },
    photocontainer: {
        backgroundColor: '#FFFFFF',
        marginTop:hp('2%') ,
        marginBottom:hp('2%')
    },
    photo: {
        width: wp('80%'),
        alignSelf:'center',
        height: wp('80%'),
        
    },
    textcontainer:{
        width:wp('88%'),
        // borderWidth:1,
        // borderColor:'red',
    },
    text: {
        color: '#FFFFFF',
        fontSize: wp('12%'),
        fontWeight:'600',
        lineHeight:wp('15%'),
        fontFamily: 'CustomFont',
    },
    task:{
        color: '#FFFFFF',
        fontSize: wp('12%'),
        fontWeight:'600',
        lineHeight:wp('15%'),
        fontFamily: 'CustomFont',

        // top: 140,
    },
    task1:{
        color: '#FED36A',
        fontSize: wp('12%'),
        fontWeight:'600',
        lineHeight:wp('15%'),
        fontFamily: 'CustomFont',

    },
    buttontext:{
        color:'#000000',
        fontSize: wp('5%'),
        fontWeight:'600',
   
    },
    button:{
        backgroundColor:'#FED36A',
        width:wp('88%'),
        height:hp('8%'),
        justifyContent:'center',
        alignItems:'center',
        marginTop:hp('4%')
    },
});
