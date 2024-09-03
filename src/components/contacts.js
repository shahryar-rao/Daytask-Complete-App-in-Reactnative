import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TouchableWithoutFeedback, Keyboard, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, addDoc,getDoc, updateDoc, doc, arrayUnion, writeBatch } from 'firebase/firestore';
import { database, auth } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Animatable from 'react-native-animatable';

export default function Contacts({ navigation }) {
    const [searchVisible, setSearchVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [currentUserCompanyId, setCurrentUserCompanyId] = useState(null);


    const currentUserId = auth.currentUser?.uid;

    const fetchCurrentUserCompanyId = async () => {
        try {
            const userDocRef = doc(database, 'users', currentUserId);
            const userDoc = await getDoc(userDocRef);
            const companyId = userDoc.data().companyId;
            setCurrentUserCompanyId(companyId);
            console.log(companyId);
            
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch current user data');
        }
    };

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(database, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            let usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter out the current user
            if (currentUserId && currentUserCompanyId) {
                usersList = usersList.filter(user => 
                    user.id !== currentUserId && user.companyId === currentUserCompanyId
                );
            }

            setUsers(usersList);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUserCompanyId();
    }, []);

    useEffect(() => {
        if (currentUserCompanyId) {
            fetchUsers();
        }
    }, [currentUserCompanyId]);

    const defaultAvatar = require('../../assets/avatar.png');

    const groupNamesByFirstLetter = (data) => {
        const groupedData = {};

        data.forEach((item) => {
            const firstLetter = item.name[0].toUpperCase();
            if (!groupedData[firstLetter]) {
                groupedData[firstLetter] = [];
            }
            groupedData[firstLetter].push(item);
        });

        return Object.keys(groupedData)
            .sort()
            .map((letter) => ({
                letter,
                data: groupedData[letter].sort((a, b) => a.name.localeCompare(b.name)),
            }));
    };

    const groupedData = groupNamesByFirstLetter(users);

    const handlePressOutside = () => {
        setSearchVisible(false);
        Keyboard.dismiss();
    };

    const handleUserSelect = (userId) => {
        if (!showGroupForm) return;

        setSelectedUsers(prevState => {
            if (prevState.includes(userId)) {
                return prevState.filter(id => id !== userId);
            } else {
                return [...prevState, userId];
            }
        });
    };

    const handleCreateGroup = async () => {
        if (groupName.trim() === '' || selectedUsers.length === 0) {
            Alert.alert('Error', 'Please enter a group name and select at least one user.');
            return;
        }
    
        try {
            const groupRef = collection(database, 'groups');
            const newGroupRef = await addDoc(groupRef, {
                name: groupName,
                groupmembers: [...selectedUsers, currentUserId],
                groupId: '',
            });
    
            // Update the groupId in the created group document
            await updateDoc(newGroupRef, {
                groupId: newGroupRef.id,
            });
    
            const batch = writeBatch(database);
    
            // Update groupid in each user's document
            for (const userId of selectedUsers) {
                const userRef = doc(database, 'users', userId);
                batch.update(userRef, {
                    groupid: arrayUnion(newGroupRef.id),
                });
            }
    
            if (currentUserId) {
                const currentUserRef = doc(database, 'users', currentUserId);
                batch.update(currentUserRef, {
                    groupid: arrayUnion(newGroupRef.id),
                });
            }
    
            await batch.commit();
    
            // Create a notification document in the notifications collection
            const notificationRef = collection(database, 'notifications');
            await addDoc(notificationRef, {
                senderId: currentUserId,
                receiverId: selectedUsers,
                groupId: newGroupRef.id,
                message: 'Added You in Group',
                timestamp: new Date(),
            });
    
            setGroupName('');
            setSelectedUsers([]);
            setShowGroupForm(false);
            Alert.alert('Success', 'Group created successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to create group');
        }
    };
    

    const renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                if (showGroupForm) {
                    handleUserSelect(item.id);
                } else {
                    navigation.navigate('Chat', { user: item });
                }
            }}
            style={[styles.usercont, selectedUsers.includes(item.id) && styles.selected]}
        >
            <Image
                source={item.avatar ? { uri: item.avatar } : defaultAvatar}
                style={styles.image}
            />
            <View style={styles.namecont}>
                <Text style={styles.name}>{item.name || 'John Doe'}</Text>
                {selectedUsers.includes(item.id) && showGroupForm && (
                    <Text style={styles.selected}>Selected</Text>
                )}
            </View>
            {item.role === 'admin' && <Text style={styles.admin}>Admin</Text>}
            </TouchableOpacity>
    );

    const renderGroup = ({ item }) => (
        <Animatable.View animation="zoomIn" duration={2000}>
            <Text style={styles.letterHeader}>{item.letter}</Text>
            <FlatList
                data={item.data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
            />
        </Animatable.View>
    );

    return (
        <SafeAreaView style={{ flex: 1,backgroundColor:'#212832' }}>
            <TouchableWithoutFeedback onPress={handlePressOutside}>
                <View style={styles.container}>
                    <View style={styles.headcontainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
                            <AntDesign name="arrowleft" size={wp(6)} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.heading}>Messages</Text>
                        <View>
                            <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
                                <AntDesign name="search1" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {searchVisible && (
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search"
                            placeholderTextColor="#fff"
                        />
                    )}
                    <View style={styles.usercont}>
                        <View style={styles.creategrupcont}>
                            <Image source={require('../../assets/profile2user.png')} />
                        </View>
                        <TouchableOpacity onPress={() => setShowGroupForm(!showGroupForm)}>
                            <View style={styles.namecont}>
                                <Text style={styles.name}>Create a group</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    {showGroupForm && (
                        <View style={styles.groupForm}>
                            <TextInput
                                style={styles.groupInput}
                                placeholder="Enter group name"
                                placeholderTextColor="#fff"
                                value={groupName}
                                onChangeText={setGroupName}
                            />
                            <TouchableOpacity style={styles.creategrpbtn} onPress={handleCreateGroup}>
                                <Text style={styles.create}>Create Group</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {loading ? (
                        <ActivityIndicator size="large" color="#FED36A" />
                    ) : (
                        <FlatList
                            data={groupedData}
                            renderItem={renderGroup}
                            keyExtractor={(item) => item.letter}
                            contentContainerStyle={{ paddingBottom: hp('2%'), width: wp('95%') }}
                        />
                    )}
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
    },
    heading: {
        fontSize: wp('5%'),
        color: '#fff',
    },
    headcontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: wp('85%'),
        // marginTop: hp('5%'),
        marginLeft: wp('6%'),
    },
    usercont: {
        width: wp('85%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp('4%'),
        height: hp('6%'),
        marginLeft: wp('6%'),
    },
    image: {
        width: wp('12%'),
        height: hp('6.2%'),
        borderRadius: 25,
    },
    namecont: {
        flexDirection: 'column',
        marginLeft: wp('4%'),
        width: wp('65%'),
        height: hp('6%'),
        justifyContent: 'center',
    },
    name: {
        fontSize: hp('2%'),
        color: '#fff',
        fontWeight: '500'
    },
    selected: {
        color: '#FED36A',
        fontSize: hp('2%'),
    },
    creategrupcont: {
        backgroundColor: '#FED36A',
        width: wp('12%'),
        height: hp('6.2%'),
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInput: {
        height: hp('6%'),
        backgroundColor: '#455A64',
        paddingHorizontal: 15,
        color: '#fff',
        marginTop: hp('2%'),
    },
    letterHeader: {
        fontSize: hp('2%'),
        color: '#FED36A',
        fontWeight: 'bold',
        marginRight: hp('3%'),
        alignSelf: 'flex-end',
    },
    groupForm: {
        marginTop: hp('2%'),
        marginLeft: wp('6%'),
        padding: wp('4%'),
        width:wp('88%'),
        backgroundColor: '#455A64',
        borderRadius: 8,
    },
    groupInput: {
        height: hp('6%'),
        backgroundColor: '#455A64',
        paddingHorizontal: 15,
        color: '#fff',
        marginBottom: hp('2%'),
    },
    creategrpbtn:{
        backgroundColor:'#FED36A',
        height:hp('5%'),
        alignItems:'center',
        justifyContent:'center',
    },
    create:{
        color:'black',
        fontWeight:'600',
        fontSize:hp('2%'),
    },
    admin:{
        fontSize:wp('2%'),
        color:'green',
        // marginRight:wp('10%'),
    }
});
