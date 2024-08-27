import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs,getDoc,doc, query, where, orderBy, limit } from 'firebase/firestore';
import { database ,auth} from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';

export default function Groups({ navigation }) {
    const [groups, setGroups] = useState([]);
    const [userGroupIds, setUserGroupIds] = useState([]);

    const currentUser = auth.currentUser;
    
    // Fetch user's group IDs
    const fetchUserGroupIds = async () => {
        try {
            // Replace 'currentUserId' with the actual ID or method to get the current user ID
            const userId = currentUser.uid; 
            const DocRef = doc(database, 'users', userId);
            const userDoc = await getDoc(DocRef);            
            if (userDoc.exists) {
                const userData = userDoc.data();
                setUserGroupIds(userData.groupid || []);
            }
        } catch (error) {
            console.error("Error fetching user group IDs: ", error);
        }
    };

    // Fetch groups based on user's group IDs
    const fetchGroups = async () => {
        try {
            // Fetch user's group IDs first
            await fetchUserGroupIds();

            if (userGroupIds.length === 0) {
                setGroups([]); // Clear any existing groups if userGroupIds is empty
                return;
            }

            // Query groups based on the user's group IDs
            // console.log(userGroupIds);
            const querySnapshot = await getDocs(query(
                collection(database, 'groups'),
                where('groupId', 'in', userGroupIds)
            ));
            const groupList = await Promise.all(
                querySnapshot.docs.map(async doc => {
                    try {
                        const messagesRef = collection(database, 'groups', doc.id, 'messages');
                        const lastMessageQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
                        const lastMessageSnapshot = await getDocs(lastMessageQuery);
                        const lastMessage = lastMessageSnapshot.docs[0]?.data();

                        return {
                            id: doc.id,
                            ...doc.data(),
                            lastMessage: lastMessage?.message || "No messages yet",
                            lastMessageTime: lastMessage?.timestamp ? lastMessage.timestamp.toDate() : null,
                        };
                    } catch (error) {
                        console.error(`Error fetching last message for group ${doc.id}: `, error);
                        return {
                            id: doc.id,
                            ...doc.data(),
                            lastMessage: "No messages yet",
                            lastMessageTime: null,
                        };
                    }
                })
            );
            groupList.sort((a, b) => (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0));

            setGroups(groupList);
        } catch (error) {
            console.error("Error fetching groups: ", error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchGroups();
        }, [userGroupIds]) // Fetch groups when userGroupIds changes
    );

    const formatTime = (timestamp) => {
        if (!timestamp) return 'No messages yet';
        const now = moment();
        const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
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

    const renderItem = ({ item }) => (
        <View style={styles.usercont}>
            <Image source={require('../../assets/avatar.png')} style={styles.image} />
            <TouchableOpacity
                onPress={() => navigation.navigate('Chat', {
                    user: {
                        ...item,
                        lastMessageTime: item.lastMessageTime?.getTime() // Convert to timestamp
                    },
                    groupId: item.id,
                    isGroupChat: true
                })}
            >               
             <View style={styles.namecont}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.msgtext}>{item.lastMessage}</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.timecont}>
                <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
            </View>
        </View>
    );


    return (
        <SafeAreaView style={{ flex: 1,backgroundColor:'#212832' }}>
            <View style={styles.container}>
                <View style={styles.headcontainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <AntDesign name="arrowleft" size={wp(6)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Groups</Text>
                    <View >
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="square-edit-outline" size={wp(6)} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.topbuttons}>
                    <TouchableOpacity style={styles.chatbutton} onPress={() => navigation.navigate('Messages')}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.groupbutton}>
                        <Text style={{ color: 'black', fontWeight: '600' }}>Groups</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={groups}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
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
        marginTop: hp('4%')
    },
    chatbutton: {
        backgroundColor: '#263238',
        height: hp('6%'),
        width: wp('40%'),
        marginRight: wp('5%'),
        alignItems: 'center',
        justifyContent: 'center'
    },
    groupbutton: {
        backgroundColor: '#FED36A',
        height: hp('6%'),
        width: wp('40%'),
        alignItems: 'center',
        justifyContent: 'center'
    },
    usercont: {
        width: wp('85%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp('4%'),
        justifyContent: 'space-between',
    },
    image: {
        width: wp('12%'),
        height: hp('6.2%'),
        borderRadius: 10,
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
    },
    time: {
        color: '#fff',
        fontSize: hp('1%'),
    },
});
