import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput , Alert, Modal,Pressable} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import { auth, signInWithEmailAndPassword,sendPasswordResetEmail } from '../../firebase';






export default function Forgetpass({ navigation }) {

    const[email,setemail]=useState('');
    const handlepassreset=()=>{
        if (!email){
            Alert.alert('Error','Please Enter Your Email')
            return;
        }
        sendPasswordResetEmail(auth,email)
        .then(() => {
            Alert.alert('Password Reset Email Sent', 'Please check your email to reset your password.');
            navigation.navigate('Login');
        })
        .catch(error => {
            Alert.alert('Password Reset Failed', error.message);
        });
    };
 return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={{ position: 'absolute', left: 20, top: 60, }}
                onPress={() => navigation.navigate('Login')}>
                <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headcontainer}>
                <View style={styles.logincontainer}>
                    <Text style={{ fontSize: 26, fontWeight: '600', zIndex: 20, color: '#fff', }}> Forget Password </Text>
                    {/* <Image source={require('../../assets/greenline.png')}
                        style={{ width: 143, left: 3, height: 8, position: 'absolute', top: 15, }}
                    /> */}
                </View>
               
            </View>
 

 
            <View style={styles.content}>
                <Text style={styles.Email}>Your email </Text>
                <TextInput
                    style={styles.input}
                    placeholder='Enter Your Email'
                    placeholderTextColor={'#fff'}
                    value={email}
                    onChangeText={setemail}
                    keyboardType='email-address'
                />
              
                <TouchableOpacity style={styles.button} onPress={handlepassreset}>
                    <Text style={styles.buttontext}>Get Password</Text>
                </TouchableOpacity>
                </View>
                
  
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        alignItems: 'center',
        justifyContent: 'center',
        padding:28,
    },
    Heading: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000E08',


    },
    logincontainer: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000E08',
    },
    headcontainer: {
        flexDirection: 'row',
        position: 'absolute',
        top: 140,
    },
    text: {
        alignSelf: 'center',
        color: '#797C7B',

    },

    Email: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8CAAB9',
        // left: 0,
    },
    content: {
        position: 'absolute',
        top: 220,
        // borderWidth:1,
        // borderColor:'black',
        height: 450,
        width: 340
    },
    input: {
        backgroundColor: '#455A64',
        width: '100%',
        color: 'white',
        top:20,
        padding:10,
    },
    button: {
        backgroundColor: '#FED36A',
        width: '100%',
        height: 48,
        top: 170,
        // borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttontext: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',

    },
    
});
