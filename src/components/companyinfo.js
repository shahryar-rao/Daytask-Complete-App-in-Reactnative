import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, setDoc, getDoc, updateDoc } from '@firebase/firestore';
import { database, auth } from '../../firebase';
import { AntDesign } from '@expo/vector-icons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function CompanyInfoView({ navigation }) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [website, setWebsite] = useState('');
    const [about, setAbout] = useState('');

    const [nameError, setNameError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [websiteError, setWebsiteError] = useState('');
    const [aboutError, setAboutError] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false); // Controls whether we are in edit mode
    const [companyId, setCompanyId] = useState(null); // Store the companyId

    useEffect(() => {
        const fetchCompanyData = async () => {
            const currentUser = auth.currentUser;

            if (currentUser) {
                const userDocRef = doc(database, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const { companyId } = userDoc.data();
                    setCompanyId(companyId); // Save companyId

                    if (companyId) {
                        const companyDocRef = doc(database, 'companies', companyId);
                        const companyDoc = await getDoc(companyDocRef);

                        if (companyDoc.exists()) {
                            const { name, address, website, about } = companyDoc.data();
                            setName(name || '');
                            setAddress(address || '');
                            setWebsite(website || '');
                            setAbout(about || '');
                        }
                    }
                }
            }
        };

        fetchCompanyData();
    }, []);

    const handleInputChange = (setter, errorSetter, value) => {
        setter(value);
        if (errorSetter) {
            errorSetter('');
        }
    };

    const validateFields = () => {
        let isValid = true;

        if (!name) {
            setNameError('Fill this field');
            isValid = false;
        }

        if (!address) {
            setAddressError('Fill this field');
            isValid = false;
        }

        if (!website) {
            setWebsiteError('Fill this field');
            isValid = false;
        }

        if (!about) {
            setAboutError('Fill this field');
            isValid = false;
        }
        return isValid;
    };

    const handleSave = async () => {
        const fieldsValid = validateFields();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log('No user is currently signed in.');
            return;
        }

        if (fieldsValid) {
            setLoading(true);
            try {
                if (companyId) {
                    // If companyId exists, update the existing document
                    const companyDocRef = doc(database, 'companies', companyId);
                    await updateDoc(companyDocRef, {
                        name,
                        address,
                        website,
                        about,
                    });

                    setModalTitle('Success');
                    setModalMessage('Company details have been successfully updated.');
                } else {
                    // Otherwise, create a new document
                    const newCompanyDocRef = doc(collection(database, 'companies'));
                    const companyData = {
                        companyId: newCompanyDocRef.id,
                        name,
                        address,
                        website,
                        about,
                        ownerId: currentUser.uid,
                    };

                    await setDoc(newCompanyDocRef, companyData);

                    const userDocRef = doc(database, 'users', currentUser.uid);
                    await updateDoc(userDocRef, { companyId: newCompanyDocRef.id }, { merge: true });

                    setModalTitle('Success');
                    setModalMessage('Company details have been successfully added.');
                }

                setModalVisible(true);
                setEditMode(false); // Exit edit mode
            } catch (error) {
                setModalTitle('Error');
                setModalMessage('There was an error saving the company details.');
                setModalVisible(true);
            } finally {
                setLoading(false);
            }
        } else {
            setModalTitle('Error');
            setModalMessage('Please Fill All Fields.');
            setModalVisible(true);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        if (modalTitle === 'Success') {
            navigation.navigate('Home'); // or navigate to the desired screen
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}
                style={{ alignSelf: 'flex-start', marginLeft: '5%', marginTop: '2%' }}>
                <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>

            {companyId && (
                <TouchableOpacity
                    onPress={editMode ? handleSave : () => setEditMode(true)}
                    style={{ position: 'absolute', padding: 10, backgroundColor: '#FED36A', top: hp('6%'), right: wp('6%') }}>
                    <Text style={{ color: 'black', fontSize: wp('4%') }}>{editMode ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>

            )}

            <View style={styles.logocontainer}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="stretch" />
            </View>

            <View style={styles.content}>
                <Text style={styles.welcome}>Company Details</Text>

                <Text style={[styles.label, nameError && styles.labelError]}>Company Name</Text>
                <View style={styles.inputcontainer}>
                    <SimpleLineIcons name="organization" size={24} color="#B8B8B8" style={styles.usertag} />
                    {editMode ? (
                        <TextInput
                            style={[styles.input, nameError && styles.inputError]}
                            placeholder='Enter Company Name'
                            placeholderTextColor={'#B8B8B8'}
                            onChangeText={(value) => handleInputChange(setName, setNameError, value)}
                            value={name}
                        />
                    ) : (
                        <Text style={styles.displayText}>{name}</Text>
                    )}
                </View>
                {nameError && <Text style={styles.errorText}>{nameError}</Text>}

                <Text style={[styles.label, addressError && styles.labelError]}>Company Address</Text>
                <View style={styles.inputcontainer}>
                    <FontAwesome name="address-book" size={24} color="#B8B8B8" style={styles.usertag} />
                    {editMode ? (
                        <TextInput
                            style={[styles.input, addressError && styles.inputError]}
                            placeholder='Address'
                            placeholderTextColor={'#B8B8B8'}
                            onChangeText={(value) => handleInputChange(setAddress, setAddressError, value)}
                            value={address}
                            multiline
                        />
                    ) : (
                        <Text style={styles.displayText}>{address}</Text>
                    )}
                </View>
                {addressError && <Text style={styles.errorText}>{addressError}</Text>}

                <Text style={[styles.label, websiteError && styles.labelError]}>Company Website</Text>
                <View style={styles.inputcontainer}>
                    <MaterialCommunityIcons name="search-web" size={24} color="#B8B8B8" style={styles.usertag} />
                    {editMode ? (
                        <TextInput
                            style={[styles.input, websiteError && styles.inputError]}
                            placeholder='Enter Website Link'
                            placeholderTextColor={'#B8B8B8'}
                            onChangeText={(value) => handleInputChange(setWebsite, setWebsiteError, value)}
                            value={website}
                        />
                    ) : (
                        <Text style={styles.displayText}>{website}</Text>
                    )}
                </View>
                {websiteError && <Text style={styles.errorText}>{websiteError}</Text>}

                <Text style={[styles.label, aboutError && styles.labelError]}>About</Text>
                <View style={styles.inputcontainer}>
                    <MaterialCommunityIcons name="account-details-outline" size={24} color="#B8B8B8" style={styles.usertag} />
                    {editMode ? (
                        <TextInput
                            style={[styles.input, aboutError && styles.inputError]}
                            placeholder='About Company'
                            placeholderTextColor={'#B8B8B8'}
                            onChangeText={(value) => handleInputChange(setAbout, setAboutError, value)}
                            value={about}
                            multiline
                        />
                    ) : (
                        <Text style={styles.displayText}>{about}</Text>
                    )}
                </View>
                {aboutError && <Text style={styles.errorText}>{aboutError}</Text>}
            </View>

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#FED36A" />
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>{modalTitle}</Text>
                                <Text style={styles.modalMessage}>{modalMessage}</Text>
                                <Pressable style={styles.modalButton} onPress={closeModal}>
                                    <Text style={styles.modalButtonText}>OK</Text>
                                </Pressable>
                            </>
                        )}
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
    displayText: {
        color: '#FFFFFF',
        fontSize: wp('4%'),
        marginLeft: hp('4%'),
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        // other styling properties for text area
    },
    content: {
        // borderWidth:1,
        // borderColor:'red',
        height: '80%',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: hp('1%'),
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
        height: hp('6.5%'),
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
        marginTop: hp('8%'),
    },
    button1: {
        flexDirection: 'row',
        width: '100%',
        height: wp('17%'),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
        marginTop: hp('3%')
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
        justifyContent:'center',
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
