import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, signInWithEmailAndPassword, } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';




export default function Login({ navigation }) {

    const [isPasswordVisible, setPasswordVisibility] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const [emailerror, setemailerror] = useState('');
    const [passerror, setpasserror] = useState('');

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            return userCredential;
        } catch (error) {
            console.log(error.message);
            setModalTitle('Error');
            setModalMessage('Invalid Email or Password');
            setModalVisible(true);
        }
        return null;
    }



    const handleLogin = async () => {
        console.log('Email:', email);
        console.log('Password:', password);

        try {
            const userCredential = await login(email, password);
            if (userCredential != null) {
                navigation.navigate('Home');
            }
        } catch (error) {
            console.log(error);
        }

    };
    const closeModal = () => {
        setModalVisible(false);
    };

    const togglePasswordVisibility = () => {
        setPasswordVisibility(!isPasswordVisible);
    };
    const validateFields = () => {
        let isValid = true;

        if (!email) {
            setemailerror('Fill this field');
            isValid = false;
        } else if (!email.includes('@gmail.com')) {
            setemailerror('Email should contain "@gmail.com"');
            isValid = false;
        }

        if (!password) {
            setpasserror('Fill this field');
            isValid = false;
        } else if (password.length < 6) {
            setpasserror('Password must be at least 6 characters');
        }


        return isValid;
    };
    const handleInputChange = (setter, errorSetter, value) => {
        setter(value);
        if (errorSetter) {
            errorSetter('');
        }
    };

    const handleForgetPass = () => {
        navigation.navigate('Forgetpass')
    };
    const handleSubmit = () => {
        if (validateFields()) {
            console.log('Form submitted:', { email, password });
            handleLogin();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logocontainer}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="stretch" />
            </View>
            <View style={styles.content}>
                <Text style={styles.welcome}>
                    Welcome Back!
                </Text>
                <Text style={[styles.label, emailerror && styles.labelError,]}>Email Address</Text>
                <View style={styles.inputcontainer}>
                    <Image source={require('../../assets/usertag.png')} style={styles.usertag} />
                    <TextInput
                        style={[styles.input, emailerror && styles.inputError]}
                        placeholder='fazzzil72@gmail.com'
                        placeholderTextColor={'#fff'}
                        onChangeText={(value) => handleInputChange(setEmail, setemailerror, value)}
                        value={email}

                    />
                </View>
                {emailerror && <Text style={styles.errorText}>{emailerror}</Text>}
                <Text style={[styles.label, passerror && styles.labelError]}>Password</Text>
                <View style={styles.inputcontainer}>
                    <Image source={require('../../assets/lock1.png')} style={styles.usertag} />
                    <TextInput
                        style={[styles.input, passerror && styles.inputError]}
                        placeholder='* * * * * *'
                        value={password}
                        onChangeText={(value) => handleInputChange(setPassword, setpasserror, value)}
                        placeholderTextColor={'#fff'}
                        secureTextEntry={!isPasswordVisible}

                    />
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconContainer}>
                        {isPasswordVisible ? (
                            <Entypo name="eye" size={22} color="white" />
                        ) : (
                            <Entypo name="eye-with-line" size={22} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                {passerror && <Text style={styles.errorText}>{passerror}</Text>}

                <TouchableOpacity style={styles.forget} onPress={()=>navigation.navigate('ForgotPass')}>
                    <Text style={{ color: '#8CAAB9', }}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttontext}>Log In</Text>
                </TouchableOpacity>
                <View style={styles.Orcontainer}>
                    <View style={styles.line}></View>
                    <Text style={{ color: '#8CAAB9', marginHorizontal: 10, fontWeight: '600', fontSize: wp('4.1%'), }}> Or continue with</Text>
                    <View style={styles.line}></View>
                </View>
                <TouchableOpacity style={styles.button1} >
                    <Image source={require('../../assets/google.png')} style={{ height: hp('3.6%'), width: wp('7.1%'), marginRight: wp('3%'), }} />
                    <Text style={styles.buttontext1}>Google</Text>
                </TouchableOpacity>
                <View style={styles.dontcontainer}>
                    <Text style={styles.account}>Don’t have an account? </Text>
                    <TouchableOpacity onPress={()=>navigation.navigate('Signup')}>
                        <Text style={styles.signup}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalMessage}>{modalMessage}</Text>
                        <Pressable style={styles.modalButton} onPress={closeModal}>
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        alignItems: 'center',
        // justifyContent: 'center',
    },
    logocontainer: {
        marginTop:hp('5%'),
    },
    logo: {
        height:hp('10%'),
        width: wp('30%'),
    },
    content: {
        // borderWidth:1,
        // borderColor:'red',
        height: '80%',
        width: '100%',
        padding: 20,
        // top: 83,

    },
    welcome: {
        color: '#fff',
        fontSize: wp('7%'),
        fontWeight: '600',
    },
    label: {
        color: '#8CAAB9',
        fontSize: wp('4%'),
        fontWeight: '300',
        marginTop: 18,
    },
    inputcontainer: {
        backgroundColor: '#455A64',
        width: wp('90%'),
        height: hp('7%'),
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        // borderWidth:1,
        // borderColor:'red',

    },
    input: {
        backgroundColor: '#455A64',
        left: 30,
        width: '70%',
        color: 'white',
    },
    usertag: {
        width: wp('5.5%'),
        height: hp('3%'),
        left: 18,
    },
    forget: {
        alignSelf: 'flex-end',
        marginTop: hp('1%'),
    },
    buttontext: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '600',

    },
    buttontext1: {
        color: '#fff',
        fontSize: wp('5%'),
        fontWeight: '500',

    },
    button: {
        backgroundColor: '#FED36A',
        width: wp('90%'),
        height: hp('8%'),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop:hp('5%'),
    },
    button1: {
        flexDirection: 'row',
        width: wp('90%'),
        height: hp('8%'),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    Orcontainer: {
        marginTop: hp('5%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('5%'),
    },
    line: {
        width: wp('27%'),
        backgroundColor: '#8CAAB9',
        height: hp('0.2%'),
    },
    dontcontainer: {
        marginTop: hp('6%'),
        flexDirection: 'row',
        justifyContent: 'center',
    },
    account: {
        color: '#8CAAB9',
        fontSize: 16,
        fontWeight: '500',
    },
    signup: {
        color: '#FED36A',
        fontSize: 16,
        fontWeight: '600',
    },
    iconContainer:{
        left:40,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: '#FED36A',
        padding: 10,
        borderRadius: 5,
        width: 60,
    },
    modalButtonText: {
        color: 'black',
        fontSize: 16,
        alignSelf: 'center',
    },
    labelError: {
        color: 'red',
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        alignSelf: 'flex-end',
    },

});
