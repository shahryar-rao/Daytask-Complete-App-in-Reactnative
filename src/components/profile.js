import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DropDownPicker from 'react-native-dropdown-picker';
import {
    auth,
    database,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    doc,
    updateDoc,
    getDoc,
    updateProfile,
    updatePassword
} from '../../firebase';

const DropdownButton = ({ label, items, open, setOpen, value, setValue, zIndex, iconsource }) => {
    return (
        <View style={styles.dropdownContainerWrapper}>
            <View style={styles.buttons}>
                <Image source={iconsource} style={styles.logos} />
                <Text style={styles.text}>{label}</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => setOpen(open === label ? null : label)}>
                    <Image source={require('../../assets/arrowdown2.png')} />
                </TouchableOpacity>
            </View>
            {open === label && (
                <DropDownPicker
                    open={true}
                    value={value}
                    items={items}
                    setOpen={setOpen}
                    setValue={setValue}
                    style={styles.dropdown}
                    containerStyle={[styles.dropdownContainer, { zIndex }]}
                />
            )}
        </View>
    );
};

const Profile = ({ navigation }) => {
    const [open, setOpen] = useState(null);
    const [value1, setValue1] = useState(null);
    const [value2, setValue2] = useState(null);
    const [value3, setValue3] = useState(null);
    const [image, setImage] = useState(null);
    const [user, setUser] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true); // State to manage loading

    const items1 = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
    ];

    const items2 = [
        { label: 'Choice 1', value: 'choice1' },
        { label: 'Choice 2', value: 'choice2' },
        { label: 'Choice 3', value: 'choice3' },
    ];

    const items3 = [
        { label: 'Selection 1', value: 'selection1' },
        { label: 'Selection 2', value: 'selection2' },
        { label: 'Selection 3', value: 'selection3' },
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const userDoc = doc(database, 'users', currentUser.uid);
                    const docSnap = await getDoc(userDoc);
                    if (docSnap.exists()) {
                        setUser(docSnap.data());
                        if (docSnap.data().avatar) {
                            setImage(docSnap.data().avatar);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false); // Set loading to false after fetching data
            }
        };

        fetchUserData();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            setImage(uri);
            uploadImage(uri);
        }
    };

    const uploadImage = async (uri) => {
        const userId = auth.currentUser.uid;
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageRef = ref(storage, `avatars/${userId}`);
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);

        const userDoc = doc(database, 'users', userId);
        await updateDoc(userDoc, { avatar: downloadURL });




    };







    const handleLogout = async () => {
        await auth.signOut();
        navigation.navigate('Login');
    };

    const handleSaveChanges = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'User not authenticated');
                return;
            }
    
            const userDoc = doc(database, 'users', user.uid);
    
            // Update name if in editing mode and name is not empty
            if (isEditingName && newName.trim() !== '') {
                await updateDoc(userDoc, { name: newName });
                await updateProfile(user, { displayName: newName });
                setUser(prevUser => ({ ...prevUser, name: newName }));
            }
    
            // Update password if in editing mode and password is not empty
            if (isEditingPassword && newPassword.trim() !== '') {
                await updatePassword(user, newPassword);
            }
    
            // Navigate back to Home screen after saving changes
            navigation.navigate('Home');
        } catch (error) {
            // Log the error to debug
            console.error('Error updating profile:', error);
    
            // Handle specific error cases
            if (error.code === 'auth/weak-password') {
                Alert.alert('Error', 'Password is too weak');
            } else if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Error', 'You need to log in again to update your password');
            } else {
                Alert.alert('Error', 'Could not save changes');
            }
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FED36A" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profilecontainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <AntDesign name="arrowleft" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.header}>Profile</Text>
                <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.imagepickcontainer}>
                <View style={styles.imagecontainer}>
                    <Image source={image ? { uri: image } : require('../../assets/avatar.png')} style={styles.image} />
                </View>
                <TouchableOpacity style={styles.plusbutton} onPress={pickImage}>
                    <View style={styles.addButton}>
                        <Image source={require('../../assets/addsquare.png')} />
                    </View>
                </TouchableOpacity>
            </View>
            <View style={{  marginTop:hp('5%'), width: '100%' }}>
                <View style={styles.buttons}>
                    <Image source={require('../../assets/useradd.png')} style={styles.logos} />
                    {isEditingName ? (
                        <TextInput
                            style={styles.textInput}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter new name"
                            placeholderTextColor={'#fff'}
                        />
                    ) : (
                        <>
                            <Text style={styles.text}>{user?.name}</Text>
                            <TouchableOpacity style={styles.editButton} onPress={() => {
                                setIsEditingName(true);
                                setNewName(user?.name || '');
                            }}>
                                <Image source={require('../../assets/edit.png')} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <View style={styles.buttons}>
                    <Image source={require('../../assets/userr.png')} style={styles.logos} />
                    <Text style={styles.text}>{user?.email}</Text>
                    <TouchableOpacity style={styles.editButton}>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttons}>
                    <Image source={require('../../assets/lockk.png')} style={styles.logos} />
                    {isEditingPassword ? (
                        <TextInput
                            style={styles.textInput}
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={'#fff'}
                        />
                    ) : (
                        <>
                            <Text style={styles.text}>Password</Text>
                            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditingPassword(true)}>
                                <Image source={require('../../assets/edit.png')} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <DropdownButton
                    label="Task"
                    iconsource={require('../../assets/task.png')}
                    items={items1}
                    open={open}
                    setOpen={setOpen}
                    value={value1}
                    setValue={setValue1}
                    zIndex={1000}
                />
                <DropdownButton
                    label="Privacy"
                    iconsource={require('../../assets/securitycard.png')}
                    items={items2}
                    open={open}
                    setOpen={setOpen}
                    value={value2}
                    setValue={setValue2}
                    zIndex={900}
                />
                <DropdownButton
                    label="Settings"
                    iconsource={require('../../assets/setting.png')}
                    items={items3}
                    open={open}
                    setOpen={setOpen}
                    value={value3}
                    setValue={setValue3}
                    zIndex={800}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Image source={require('../../assets/logout.png')} style={{ right: 10 }} />
                <Text style={styles.buttontext}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    buttontext: {
        color: '#000000',
        fontSize: wp('5%'),
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#FED36A',
        width: '100%',
        height: hp('7.5%'),
        justifyContent: 'center',
        alignItems: 'center',
        // top: 150,
        marginTop:hp('5%'),
        flexDirection: 'row',
    },
    profilecontainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        // top: 20,
        marginTop:hp('2%'),

    },
    header: {
        fontSize: wp('5%'),
        fontWeight: '500',
        color: '#fff',
    },
    imagepickcontainer: {
        height: 133,
        width: 133,
        marginTop:hp('5%'),

        // top: 80,
    },
    imagecontainer: {
        height: 133,
        width: 133,
        borderRadius: 67,
        borderWidth: 2,
        borderColor: '#FED36A',
        padding: 2,
        
    },
    image: {
        width: 126,
        height: 126,
        borderRadius: 63,
    },
    plusbutton: {
        position: 'absolute',
        bottom: 8,
        right: 3,
    },
    addButton: {
        width: 33,
        height: 33,
        borderRadius: 17,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttons: {
        width: '100%',
        height: hp('6%'),
        backgroundColor: '#455A64',
        flexDirection: 'row',
        padding: 10,
        marginTop: hp('2%'),
    },
    logos: {
        height: 24,
        width: 24,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 16,
        fontWeight: '400',
        color: '#fff',
        left: 10,
    },
    editButton: {
        height: 24,
        width: 24,
        position: 'absolute',
        right: 14,
        // top: 10,
        marginTop:hp('1.5%'),

    },
    dropdown: {
        backgroundColor: '#fafafa',
    },
    dropdownContainer: {
        width: '70%',
        // top: 30,
        right: 0,
        position: 'absolute',
    },
    dropdownContainerWrapper: {
        position: 'relative',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#455A64',
        borderRadius: 5,
        marginRight: 10,
        marginLeft: 10,
        color: '#fff'
    },
    saveButton: {
        backgroundColor: '#FED36A',
        borderRadius: 2,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal:wp('2%'),
    },
    saveButtonText: {
        color: '#000',
        fontWeight: '600',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#212832',
    }
});

export default Profile;