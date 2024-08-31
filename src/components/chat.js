import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, Pressable, TextInput, FlatList, Keyboard, AppState } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { collection, doc, addDoc, query, orderBy, onSnapshot, writeBatch, getDocs, getDoc, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { database, auth } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRoute } from '@react-navigation/native';
import useUpdateLastActive from './helpers/trackactivity';
import Constants from 'expo-constants';
import axios from 'axios';


// Function to get time ago string
const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Offline';

    const now = new Date();
    const timeDiff = now - timestamp.toDate();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'Online'; // Consider online if the last active timestamp is within the last minute
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 30) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    }
};

export default function Chat({ navigation }) {
    useUpdateLastActive();




    const route = useRoute();
    const { user, groupId, isGroupChat } = route.params;
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({});
    const [status, setStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [appState, setAppState] = useState(AppState.currentState);
    const currentUser = auth.currentUser;
    const flatListRef = useRef();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMessages, setFilteredMessages] = useState([]);

    // Fetch messages function
    const fetchMessages = useCallback(() => {
        if (currentUser) {
            if (isGroupChat && groupId) {
                const groupDocRef = doc(database, 'groups', groupId);
                const messagesRef = collection(groupDocRef, 'messages');
                const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

                const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
                    const messagesList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    setMessages(messagesList);
                    setFilteredMessages(messagesList);
                    setLoading(false);
                });

                return () => unsubscribe();
            } else {
                const chatId = [currentUser.uid, user.id].sort().join('_');
                const messagesRef = collection(database, 'chats', chatId, 'messages');
                const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

                const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
                    const messagesList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    setMessages(messagesList);
                    setFilteredMessages(messagesList);
                    setLoading(false);
                });

                return () => unsubscribe();
            }
        }
    }, [currentUser, user?.id, groupId, isGroupChat]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Filter messages based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredMessages(messages);
        } else {
            const filtered = messages.filter(msg => msg.message.toLowerCase().includes(searchQuery.toLowerCase()));
            setFilteredMessages(filtered);
        }
    }, [searchQuery, messages]);

    // Send message function
    const sendMessage = async () => {
        if (message.trim()) {
            setMessage('');
            Keyboard.dismiss();
            try {
                const chatId = [currentUser.uid, user.id].sort().join('_');
                const messagesRef = collection(database, 'chats', chatId, 'messages');

                await addDoc(messagesRef, {
                    senderId: currentUser.uid,
                    receiverId: user.id,
                    message: message.trim(),
                    timestamp: Timestamp.fromDate(new Date()),
                    status: 'sent'
                });

                // Update friends list
                const currentUserDocRef = doc(database, 'users', currentUser.uid);
                await updateDoc(currentUserDocRef, {
                    friends: arrayUnion(user.id),
                });

                const otherUserDocRef = doc(database, 'users', user.id);
                await updateDoc(otherUserDocRef, {
                    friends: arrayUnion(currentUser.uid),
                });

            } catch (error) {
                console.error("Error sending message: ", error);
            }
        }
    };

    // Send group message function
    const sendGroupMessage = async () => {
        if (message.trim()) {
            setMessage('');
            Keyboard.dismiss();
            try {
                const groupDocRef = doc(database, 'groups', groupId);
                const messagesRef = collection(groupDocRef, 'messages');

                await addDoc(messagesRef, {
                    message: message.trim(),
                    senderId: currentUser.uid,
                    groupId: groupId,
                    timestamp: Timestamp.fromDate(new Date())
                });

            } catch (error) {
                console.error("Error sending group message: ", error);
            }
        }
    };

    // Scroll to top when messages change
    useEffect(() => {
        if (flatListRef.current && filteredMessages.length > 0) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
    }, [filteredMessages]);

    // Fetch user data and update status
    const fetchUserData = async () => {
        if (isGroupChat) {
            try {
                const userDocRefs = messages.map(msg => doc(database, 'users', msg.senderId));
                const userDocs = await Promise.all(userDocRefs.map(ref => getDoc(ref)));
                const users = userDocs.reduce((acc, doc) => {
                    if (doc.exists()) {
                        acc[doc.id] = doc.data();
                    }
                    return acc;
                }, {});
                setUserData(users);
                setLoadingStatus(false);
            } catch (error) {
                console.error("Error fetching user data: ", error);
                setStatus('Error fetching status');
                setLoadingStatus(false);
            }
        } else {
            try {
                const userDocRef = doc(database, 'users', user.id);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const lastActive = userData?.lastActive;
                    setStatus(lastActive ? getTimeAgo(lastActive) : 'Online');
                } else {
                    setStatus('User not found');
                }
                setLoadingStatus(false); // Update loading status when data is fetched
            } catch (error) {
                console.error("Error fetching user data: ", error);
                setStatus('Error fetching status');
                setLoadingStatus(false);
            }
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [messages, isGroupChat]);


    const collectMessages = () => {
        if (isGroupChat && groupId) {
            return filteredMessages; // All messages from group chat
        } else {
            return filteredMessages; // All messages from individual chat
        }
    };


    const generateSummary = async (messages) => {
        try {
            // Adjust the request object based on API documentation
            const request = {
                contents: [{
                    parts: [{
                        text: `Here is the conversation between the users, I want that to summarize in 2 to 3 lines, ${messages.map(msg => msg.message).join(' ')}`,
                    }],
                }],
            };
            const client = axios.create({
                headers: {
                    'Content-Type': 'application/json',

                }
            });

            // Send the request to the API
            const response = await client.post(Constants.expoConfig.extra.AI_API_URL, request);

            console.log(response.data);

            if (response.status === 200) {
                const data = response.data;
                console.log(response.data.candidates[0].content.parts[0].text);
                return response.data.candidates[0].content.parts[0].text;

            } else {
                console.error('API response error:', response.status, response.statusText);
                return 'Error generating summary';
            }
        } catch (error) {
            console.error('Error generating summary:', error.response ? error.response.data : error.message);
            return 'Error generating summary';
        }
    };






    const handleSummary = async () => {
        setModalVisible(false);
        const messages = collectMessages();
        // const messageTexts = messages.map(msg => msg.message);
        const summary = await generateSummary(messages);
        setMessage(summary);
    };



    // Mark messages as seen
    const markMessagesAsSeen = async () => {
        if (!isGroupChat && currentUser) {
            const unseenMessages = messages.filter(msg =>
                msg.receiverId === currentUser.uid &&
                msg.status === 'sent' &&
                msg.senderId !== currentUser.uid
            );

            for (const message of unseenMessages) {
                const messageRef = doc(database, 'chats', [currentUser.uid, user.id].sort().join('_'), 'messages', message.id);
                await updateDoc(messageRef, {
                    status: 'seen',
                });
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            markMessagesAsSeen();
        }, 1000);

        return () => clearTimeout(timer);
    }, [messages]);

    // Handle app state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                fetchUserData(); // Refresh user data when app comes to the foreground
            }
            setAppState(nextAppState);
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove(); // Clean up subscription
        };
    }, [appState]);


    const clearAllChats = async () => {
        if (currentUser) {
            try {
                let messagesRef;
                if (isGroupChat && groupId) {
                    // Reference the group messages subcollection
                    const groupDocRef = doc(database, 'groups', groupId);
                    messagesRef = collection(groupDocRef, 'messages');
                } else {
                    // Reference the individual chat messages subcollection
                    const chatId = [currentUser.uid, user.id].sort().join('_');
                    messagesRef = collection(database, 'chats', chatId, 'messages');
                }

                // Query all documents in the messages subcollection
                const messagesQuery = query(messagesRef);
                const querySnapshot = await getDocs(messagesQuery);

                // Use a batch to delete all documents
                const batch = writeBatch(database);
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // Commit the batch
                await batch.commit();

                // Clear local messages state
                setMessages([]);
                setFilteredMessages([]);

                console.log('All chats cleared successfully');
            } catch (error) {
                console.error('Error clearing chats: ', error);
            }
        }
    };





    // Render individual message
    const renderIndividualMessage = ({ item }) => {
        const messagetext = item.senderId === currentUser.uid ? styles.messageText : styles.messageText1;
        const messageStatus = item.senderId === currentUser.uid && item.status === 'seen' ? '  Seen' : '';

        return (
            <View style={[styles.messageContainer, item.senderId === currentUser.uid ? styles.sentMessage : styles.receivedMessage]}>
                <Text style={messagetext}>{item.message}</Text>
                <Text style={styles.messageStatus}>{messageStatus}</Text>
            </View>
        );
    };

    // Render group message
    const renderGroupMessage = ({ item }) => {
        const messagetext = item.senderId === currentUser.uid ? styles.messageText : styles.messageText1;
        const messageUser = userData[item.senderId] || {};
        const name = item.senderId === currentUser.uid ? styles.messageUser1 : styles.messageUser;
        return (
            <View style={[styles.groupMessageContainer, item.senderId === currentUser.uid ? styles.right : styles.left]}>
                {item.senderId !== currentUser.uid && (
                    <Image
                        source={{ uri: messageUser.avatar }}
                        style={styles.avatar}
                    />
                )}
                <View style={[styles.messageContainer, item.senderId === currentUser.uid ? styles.sentMessage : styles.receivedMessage]}>
                    <Text style={name}>{messageUser.name}</Text>
                    <Text style={messagetext}>{item.message}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headcontainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
                    <AntDesign name="arrowleft" size={wp(6)} color="white" />
                </TouchableOpacity>
                <View style={styles.usercont}>
                    <Image
                        source={user?.avatar ? { uri: user.avatar } : require('../../assets/avatar.png')}
                        style={styles.image}
                    />
                    <View style={styles.namecont}>
                        <Text style={styles.name}>{user?.name || 'Group Chat'}</Text>
                        {isGroupChat ? (
                            <TouchableOpacity onPress={() => {/* Navigate to group info */ }}>
                                <Text style={styles.online}>Tap here for group info</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.online}>{loadingStatus ? ' ' : status}</Text>
                        )}
                    </View>

                    <TouchableOpacity style={{ marginRight: wp('4%') }}>
                        <Feather name="video" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginRight: wp('4%') }}>
                        <Feather name="phone-call" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Entypo name="dots-three-vertical" size={24} color="white" />
                    </TouchableOpacity>

                </View>
            </View>
            {searchVisible && (
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search messages..."
                        placeholderTextColor={'gray'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery(''); }}>
                        <Feather name="x" size={26} color="gray" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={searchVisible ? styles.messagesContainer1 : styles.messagesContainer}>
                {isGroupChat ? (
                    <FlatList
                        ref={flatListRef}
                        data={filteredMessages}
                        renderItem={renderGroupMessage}
                        keyExtractor={(item, index) => index.toString()}
                        inverted
                    />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredMessages}
                        renderItem={renderIndividualMessage}
                        keyExtractor={(item, index) => index.toString()}
                        inverted
                    />
                )}
            </View>
            <View style={styles.bottomcontainer}>
                <View style={styles.qrcont}>
                    <TouchableOpacity>
                        <MaterialIcons name="qr-code" size={30} color="#FED36A" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder='Type a message'
                        placeholderTextColor={'#8CAAB9'}
                        value={message}
                        onChangeText={setMessage}
                        onSubmitEditing={isGroupChat ? sendGroupMessage : sendMessage}
                        multiline
                    />
                    <TouchableOpacity onPress={isGroupChat ? sendGroupMessage : sendMessage}>
                        <Feather name="send" size={24} color="#FED36A" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.micbtn}>
                    <Feather name="mic" size={24} color="#FED36A" />
                </TouchableOpacity>
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Option</Text>
                        <Pressable
                            style={styles.modalButton}
                            onPress={async () => {
                                await clearAllChats();
                                setModalVisible(false); // Close the modal after clearing chats
                            }}
                        >
                            <Text style={styles.modalButtonText}>Clear Chat</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalButton}
                            onPress={() => {
                                setModalVisible(false);
                                setSearchVisible(true);
                            }}
                        >
                            <Text style={styles.modalButtonText}>Search</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalButton}
                            onPress={() => {
                                setModalVisible(false);
                                handleSummary();
                            }}
                        >
                            <Text style={styles.modalButtonText}>Summary</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>

    );
}

// Styles remain the same



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        paddingHorizontal: 28,
    },
    loader: {
        flex: 1,
        backgroundColor: '#212832',
        paddingHorizontal: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headcontainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: wp('85%'),
        // marginTop: hp('6%'),
    },
    usercont: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp('6%'),
        marginLeft: wp('5%'),
    },
    image: {
        width: wp('12%'),
        height: hp('6.2%'),
        borderRadius: 25,
    },
    namecont: {
        flexDirection: 'column',
        marginLeft: wp('4%'),
        width: wp('36%'),
        height: hp('6%'),
        justifyContent: 'center',
    },
    name: {
        fontSize: hp('2%'),
        color: '#fff',
        fontWeight: '600'
    },
    online: {
        color: '#B8B8B8',
    },
    bottomcontainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: hp('2%'),
        width: wp('90%'),
        // height: hp('7%'),
        alignSelf: 'center',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#263238',
        width: wp('50%'),
        // height: hp('7%'),
        marginLeft: wp('4%'),
        color: '#fff',
    },
    searchInput: {
        backgroundColor: '#263238',
        width: wp('80%'),
        height: hp('5%'),
        paddingLeft: wp('2%'),
        // marginLeft: wp('4%'),
        color: '#fff'
    },
    searchContainer: {
        backgroundColor: '#263238',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qrcont: {
        backgroundColor: '#263238',
        // height: hp('7%'),
        width: wp('75%'),
        alignItems: 'center',
        flexDirection: 'row',
        padding: 10,
    },
    micbtn: {
        width: wp('12%'),
        height: hp('7%'),
        backgroundColor: '#263238',
        marginLeft: wp('2%'),
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageContainer: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
    },
    groupMessageContainer: {
        // padding: 10,
        // marginVertical: 5,
        // borderRadius: 10,
        flexDirection: 'row',
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#FED36A',
        marginRight: wp('5%'),
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#263238',
    },
    sentMessage1: {
        alignSelf: 'flex-end',
    },
    receivedMessage1: {
        alignSelf: 'flex-start',
    },
    messageText: {
        color: 'black',
        fontSize: 16,
    },
    messageText1: {
        color: '#B8B8B8',
        fontSize: 16,
    },
    messagesContainer: {
        width: wp('95%'),
        paddingTop: hp('1%'),
        paddingBottom: hp('21%'),
    },
    messagesContainer1: {
        width: wp('95%'),
        paddingTop: hp('1%'),
        paddingBottom: hp('26%'),
    },
    senderName: {
        color: 'white',
        fontSize: wp('4%'),
        fontWeight: '500',
    },
    senderName1: {
        color: 'black',
        fontSize: wp('4%'),
        fontWeight: '500',
    },
    grpmemberimg: {
        width: wp('10%'),
        height: hp('5%'),
        marginRight: wp('2%'),
        borderRadius: 20,
        // borderWidth:1,
        // borderColor:'red',
    },
    groupview: {
        flexDirection: 'row',
    },
    messageStatus: {
        fontSize: wp('2%'),
        position: 'absolute',
        alignSelf: 'flex-end',
        bottom: hp('0%'),
        right: wp('1%'),
    },
    modalOverlay: {
        flex: 1,
        // alignSelf:'flex-end',
        // justifyContent: 'center',
        // alignItems: 'center',
        // backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#212832',
        shadowColor:'#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderRadius: 10,
        padding: 20,
        width: '45%',
        alignItems: 'center',
        top: hp('7%'),
        marginRight: wp('6%'),
        right: 0,
        position: 'absolute'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#fff'
    },
    modalButton: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        backgroundColor: '#FED36A',
        width: wp('28%'),
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'black',
        fontSize: wp('4%'),
    },
    avatar: {
        height: hp('4%'),
        width: wp('8%'),
        borderRadius: wp('4%'),
    },
    right: {
        alignSelf: 'flex-end',
    },
    messageUser: {
        fontSize: wp('4%'),
        color: '#fff',
        fontWeight: '600',
    },
    messageUser1: {
        fontSize: wp('4%'),
        color: 'black',
        fontWeight: '600',
    },

});
