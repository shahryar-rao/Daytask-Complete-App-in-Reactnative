import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { doc, getDoc, getDocs, collection, query, orderBy, where, limit, onSnapshot, writeBatch } from 'firebase/firestore';
import { auth, database } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Entypo from '@expo/vector-icons/Entypo';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';

export default function Messages({ navigation }) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [update, setUpdate] = useState(false);

    const currentUser = auth.currentUser;

    const formatTime = (timestamp) => {
        if (!timestamp) return 'No messages yet';
        const now = moment();
        const date = timestamp.toDate();
        const diff = now.diff(moment(date));
        const duration = moment.duration(diff);

        if (duration.asSeconds() < 60) {
            return `${Math.floor(duration.asSeconds())} sec ago`;
        } else if (duration.asMinutes() < 60) {
            return `${Math.floor(duration.asMinutes())} min ago`;
        } else if (duration.asHours() < 24) {
            return `${Math.floor(duration.asHours())} hour${Math.floor(duration.asHours()) > 1 ? 's' : ''} ago`;
        } else {
            return moment(date).format('DD MMMM');
        }
    };

    const fetchFriends = useCallback(async () => {
        if (!currentUser) return;
    
        // setLoading(true);  // Start loading
    
        try {
            const userDocRef = doc(database, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const friendsList = userData.friends || [];
    
                let friendsData = [];
    
                // Fetch initial data for all friends
                for (const friendId of friendsList) {
                    const friendDocRef = doc(database, 'users', friendId);
                    const friendDoc = await getDoc(friendDocRef);
    
                    if (friendDoc.exists()) {
                        const friendData = friendDoc.data();
                        const chatId = [currentUser.uid, friendId].sort().join('_');
                        const messagesRef = collection(database, 'chats', chatId, 'messages');
                        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    
                        const messageSnapshot = await getDocs(messagesQuery);
                        const lastMessage = messageSnapshot.docs.length > 0 ? messageSnapshot.docs[0].data() : null;
    
                        const unreadMessagesQuery = query(
                            messagesRef,
                            where('status', '==', 'sent'),
                            where('receiverId', '==', currentUser.uid)
                        );
                        const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
                        const unreadCount = unreadMessagesSnapshot.docs.length;
    
                        friendsData.push({
                            id: friendId,
                            ...friendData,
                            lastMessage: lastMessage ? lastMessage.message : 'No messages yet',
                            lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                            unreadCount: unreadCount
                        });
                    }
                }
    
                // Sort the friends data before setting state
                friendsData = friendsData.sort((a, b) => {
                    if (a.lastMessageTime && b.lastMessageTime) {
                        return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis();
                    }
                    return 0;
                });
    
                setFriends(friendsData); // Update the state with sorted data
    
                // Set up real-time listeners
                friendsList.forEach((friendId) => {
                    const chatId = [currentUser.uid, friendId].sort().join('_');
                    const messagesRef = collection(database, 'chats', chatId, 'messages');
                    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    
                    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
                        const lastMessage = snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
    
                        const unreadMessagesQuery = query(
                            messagesRef,
                            where('status', '==', 'sent'),
                            where('receiverId', '==', currentUser.uid)
                        );
                        const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
                        const unreadCount = unreadMessagesSnapshot.docs.length;
    
                        setFriends((prevFriends) => {
                            const updatedFriends = prevFriends.map(friend =>
                                friend.id === friendId
                                    ? {
                                        ...friend,
                                        lastMessage: lastMessage ? lastMessage.message : 'No messages yet',
                                        lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                                        unreadCount: unreadCount
                                    }
                                    : friend
                            );
    
                            // Sort again after updating
                            return updatedFriends.sort((a, b) => {
                                if (a.lastMessageTime && b.lastMessageTime) {
                                    return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis();
                                }
                                return 0;
                            });
                        });
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching friends: ', error);
        } finally {
            setLoading(false);  // End loading
        }
    }, [currentUser, update]);
    
    useFocusEffect(
        useCallback(() => {
            fetchFriends();
        }, [fetchFriends])
    );
      

    useFocusEffect(
        React.useCallback(() => {
            fetchFriends();
        }, [fetchFriends])
    );

    const handleChatOpen = async (item) => {
        navigation.navigate('Chat', { user: item });

        setFriends(prevFriends =>
            prevFriends.map(friend =>
                friend.id === item.id ? { ...friend, unreadCount: 0 } : friend
            )
        );

        try {
            const chatId = [currentUser.uid, item.id].sort().join('_');
            const messagesRef = collection(database, 'chats', chatId, 'messages');
            
            const unreadMessagesQuery = query(
                messagesRef,
                where('status', '==', 'sent'),
                where('receiverId', '==', currentUser.uid)
            );
            const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
            
            const batch = writeBatch(database);
            
            unreadMessagesSnapshot.forEach((doc) => {
                batch.update(doc.ref, { read: true });
            });
            
            await batch.commit();
            
            setUpdate(prevUpdate => !prevUpdate);
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.usercont}>
            <Image source={{ uri: item.avatar }} style={styles.image} />
            <TouchableOpacity onPress={() => handleChatOpen(item)}>
                <View style={styles.namecont}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.msgtext}>{item.lastMessage}</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.timecont}>
                <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator size="large" color="#FED36A" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1,backgroundColor:'#212832' }}>
            <StatusBar style='auto'/>
            <View style={styles.container}>
                <View style={styles.headcontainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <AntDesign name="arrowleft" size={wp(6)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Messages</Text>
                    <View>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="square-edit-outline" size={wp(6)} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.topbuttons}>
                    <TouchableOpacity style={styles.chatbutton}>
                        <Text style={{ color: 'black', fontWeight: '600' }}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.groupbutton} onPress={() => navigation.navigate('Groups')}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Groups</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={friends}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                />
                <TouchableOpacity style={styles.startchatbtn} onPress={() => navigation.navigate('Contacts')}>
                    <Text style={styles.startchatbtntxt}>Start Chat</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.bottomcontainer}>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Home')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/home2.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A' }}>Home</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Messages')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/messages1.png')} style={styles.home} />
                        <Text style={{ color: '#FED36A' }}>Chat</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Addtask')}>
                    <View style={styles.bottombutton1}>
                        <Image source={require('../../assets/add.png')} style={styles.home} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Schedule')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/calendar.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A' }}>Calendar</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Notification')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/notification.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A' }}>Notification</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        paddingHorizontal: 28,
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
    },
    bottomcontainer: {
        width: wp('100%'),
        height: hp('11%'),
        backgroundColor: '#263238',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
    },
    bottombutton: {
        flexDirection: 'column',
        height: hp('7%'),
        width: wp('19%'),
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottombutton1: {
        flexDirection: 'column',
        height: hp('7%'),
        width: wp('14%'),
        backgroundColor: '#FED36A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topbuttons: {
        flexDirection: 'row',
        width: wp('85%'),
        marginTop: hp('4%'),
    },
    chatbutton: {
        backgroundColor: '#FED36A',
        height: hp('6%'),
        width: wp('40%'),
        marginRight: wp('5%'),
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupbutton: {
        backgroundColor: '#263238',
        height: hp('6%'),
        width: wp('40%'),
        alignItems: 'center',
        justifyContent: 'center',
    },
    usercont: {
        width: wp('85%'),
        flexDirection: 'row',
        marginTop: hp('4%'),
        alignItems: 'center',
        justifyContent:'space-between',
    },
    image: {
        width: wp('12%'),
        height: hp('6%'),
        borderRadius: 25,
    },
    namecont: {
        flexDirection: 'column',

    },
    name: {
        fontSize: hp('2%'),
        color: '#fff',
        fontWeight: '500',
        paddingHorizontal:10,
    },
    msgtext: {
        fontSize: hp('1.5%'),
        color: '#B8B8B8',
        width:wp('60%'),
        // borderWidth:1,
        // borderColor:'#fff',
        paddingHorizontal:10,
    },
    timecont: {
        flexDirection: 'column',
        alignItems:'flex-end',
    },
    time: {
        color: '#fff',
        fontSize: hp('1%'),
    },
    startchatbtn: {
        backgroundColor: '#FED36A',
        height: hp('6%'),
        width: wp('35%'),
        position: 'absolute',
        bottom: hp('18%'),
        alignItems: 'center',
        justifyContent: 'center',
        right: wp('6%'),
    },
    startchatbtntxt: {
        color: 'black',
        fontWeight: '600',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#212832',
    },
    bottomicon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    home: {
        width: wp('6%'),
        height: hp('3.2%'),
    },
    unreadBadge: {
        backgroundColor: '#FED36A',
        borderRadius: wp('7%'),
        height:hp('2%'),
        width:wp('4%'),
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:hp('1%'),
    },
    unreadCount: {
        color: '#000',
        fontSize: hp('1.5%'),
        fontWeight: 'bold',
    },
});
