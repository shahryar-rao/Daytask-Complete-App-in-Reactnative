import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from 'expo-checkbox';
import { auth, createUserWithEmailAndPassword } from '../../firebase';
import { database } from '../../firebase';
import { collection, doc, setDoc } from '@firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';




export default function Signup({ navigation }) {

    const [isPasswordVisible, setPasswordVisibility] = useState(false);
    const [isChecked, setChecked] = useState(false);

    const [name, setname] = useState('');
    const [email, setemail] = useState('');
    const [pass, setpass] = useState('');

    const [nameerror, setnameerror] = useState('');
    const [emailerror, setemailerror] = useState('');
    const [passerror, setpasserror] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const [loading, setLoading] = useState(false);




    const signup = async (emaill, password) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, emaill, password);
            const usercollection = collection(database, 'users');
            if (userCredential) {
                const userdoc = doc(usercollection, userCredential.user.uid)
                await setDoc(userdoc, {
                    uid: userCredential.user.uid,
                    name: name,
                    email: email,
                    avatar:'https://firebasestorage.googleapis.com/v0/b/daytask-bab6c.appspot.com/o/avatar.png?alt=media&token=98d73b78-ac02-45bf-aa67-8884da63b0ef',
                });
                setModalTitle('Success');
                setModalMessage('Account Successfully Created');
                setModalVisible(true);
            }
        } catch (error) {
            setModalTitle('Error');
            setModalMessage('The email address is already in use by another account.');
            setModalVisible(true);
            console.log("Firebase Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (setter, errorSetter, value) => {
        setter(value);
        if (errorSetter) {
            errorSetter('');
        }
    };

    const validateFields = () => {
        let isValid = true;

        if (!name) {
            setnameerror('Fill this field');
            isValid = false;
        }

        if (!email) {
            setemailerror('Fill this field');
            isValid = false;
        } else if (!email.includes('@gmail.com')) {
            setemailerror('Email should contain "@gmail.com"');
            isValid = false;
        }

        if (!pass) {
            setpasserror('Fill this field');
            isValid = false;
        } else if (pass.length < 6) {
            setpasserror('Password must be at least 6 characters');
            isValid = false;
        }


        return isValid;
    };

    const handleSubmit = async () => {
        const fieldsValid = validateFields();

        if (fieldsValid && isChecked) {
            console.log('Form submitted:', { name, email, pass });
            await signup(email, pass);
        } else {
            if (!isChecked) {
                setModalTitle('Error');
                setModalMessage('You Should Agree to the terms first');
            } else {
                setModalTitle('Error');
                setModalMessage('Please correct the errors in the form');
            }
            setModalVisible(true);
        }
    };


    const closeModal = () => {
        setModalVisible(false);
        if (modalTitle === 'Success') {
            navigation.navigate('Login');
        }
    };

    const togglePasswordVisibility = () => {
        setPasswordVisibility(!isPasswordVisible);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logocontainer}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="stretch" />
            </View>
            <View style={styles.content}>
                <Text style={styles.welcome}>
                    Create your account
                </Text>
                <Text style={[styles.label, nameerror && styles.labelError]}>Full Name</Text>
                <View style={styles.inputcontainer}>
                    <Image source={require('../../assets/user.png')} style={styles.usertag} />
                    <TextInput
                        style={[styles.input, nameerror && styles.inputError]}
                        placeholder='Enter Your Name'
                        placeholderTextColor={'#fff'}
                        onChangeText={(value) => handleInputChange(setname, setnameerror, value)}
                        value={name}

                    />
                </View>
                {nameerror && <Text style={styles.errorText}>{nameerror}</Text>}

                <Text style={[styles.label, emailerror && styles.labelError,]}>Email Address</Text>
                <View style={styles.inputcontainer}>
                    <Image source={require('../../assets/usertag.png')} style={styles.usertag} />
                    <TextInput
                        style={[styles.input, emailerror && styles.inputError]}
                        placeholder='abcd123@gmail.com'
                        placeholderTextColor={'#fff'}
                        onChangeText={(value) => handleInputChange(setemail, setemailerror, value)}
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
                        placeholderTextColor={'#fff'}
                        secureTextEntry={!isPasswordVisible}
                        onChangeText={(value) => handleInputChange(setpass, setpasserror, value)}
                        value={pass}

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

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        style={{ borderRadius: 5, borderColor: '#FED36A', borderWidth: 1, top: 10, }}
                        value={isChecked}
                        onValueChange={setChecked}
                        color={isChecked ? '#FED36A' : undefined}
                    />
                    <Text style={styles.checkboxLabel}>I have read & agreed to DayTask </Text>
                    <TouchableOpacity >
                        <Text style={{ color: '#FED36A',fontSize: wp('3.7%'), }}> Privacy Policy,</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ marginTop: hp('1.7%'), marginLeft:wp('9%'), }}>
                    <Text style={{ color: '#FED36A',fontSize: wp('3.7%'), }}>Terms & Condition</Text></TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttontext}>Sign Up</Text>
                </TouchableOpacity>
                <View style={styles.Orcontainer}>
                    <View style={styles.line}></View>
                    <Text style={{ color: '#8CAAB9', marginHorizontal: wp('2.7%'), fontWeight: '600', fontSize: wp('4%'), }}> Or continue with</Text>
                    <View style={styles.line}></View>
                </View>
                <TouchableOpacity style={styles.button1} >
                    <Image source={require('../../assets/google.png')} style={{ height: hp('2.6%'), width:wp('5%'), marginRight: 10, }} />
                    <Text style={styles.buttontext1}>Google</Text>
                </TouchableOpacity>
                <View style={styles.dontcontainer}>
                    <Text style={styles.account}>Don’t have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.signup}>Log In</Text>
                    </TouchableOpacity>
                </View>
                {loading &&
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#FED36A" />
                    </View>
                }
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
        // marginTop: hp('6%'),
    },
    logo: {
        height: hp('10%'),
        width: wp('30%'),
    },
    content: {
        // borderWidth:1,
        // borderColor:'red',
        height: '80%',
        width: '100%',
        padding: 20,
        marginTop: hp('2.5%')
    },
    welcome: {
        color: '#fff',
        fontSize: wp('6%'),
        fontWeight: '600',
    },
    label: {
        color: '#8CAAB9',
        fontSize: wp('4.2%'),
        fontWeight: '300',
        marginTop: hp('2%'),
    },
    inputcontainer: {
        backgroundColor: '#455A64',
        width: '100%',
        height: hp('6%'),
        marginTop: hp('1%'),
        flexDirection: 'row',
        alignItems: 'center',

    },
    input: {
        backgroundColor: '#455A64',
        left: 30,
        width: '70%',
        color: 'white',
    },
    usertag: {
        width: wp('5%'),
        height: hp('2.5%'),
        left: 18,
    },
    forget: {
        alignSelf: 'flex-end',
        marginTop: 5,
    },
    buttontext: {
        color: '#000000',
        fontSize: wp('5%'),
        fontWeight: '600',

    },
    buttontext1: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',

    },
    button: {
        backgroundColor: '#FED36A',
        width: '100%',
        height: wp('15%'),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp('3%'),
    },
    button1: {
        flexDirection: 'row',
        width: '100%',
        height: wp('17%'),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
        marginTop:hp('3%')
    },
    Orcontainer: {
        marginTop: ('10%'),
        flexDirection: 'row',
        alignItems: 'center',
    },
    line: {
        width: '30%',
        backgroundColor: '#8CAAB9',
        height: hp('0.2%'),
    },
    dontcontainer: {
        marginTop: hp('2%'),
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
    iconContainer: {
        left: 40,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: wp('2%'),
        top: 15,
    },
    checkboxLabel: {
        marginLeft: wp('2%'),
        fontSize: wp('3.7%'),
        color: '#8CAAB9',
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
    loaderContainer: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

});
