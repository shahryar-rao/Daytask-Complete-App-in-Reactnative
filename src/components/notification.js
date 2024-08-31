import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, database } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import moment from 'moment';

export default function Notification({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUserId = auth.currentUser.uid;

        const fetchNotifications = async () => {
            try {
                const notificationRef = collection(database, 'notifications');
                const notificationSnapshot = await getDocs(notificationRef);
                const notificationsData = [];

                for (const docSnapshot of notificationSnapshot.docs) {
                    const notification = docSnapshot.data();

                    // Skip notifications where the sender is the current user
                    if (notification.senderId === currentUserId) {
                        continue;
                    }

                    // Check if the current user is a receiver
                    if (notification.receiverId && notification.receiverId.includes(currentUserId)) {
                        // Fetch sender's data
                        const senderDoc = await getDoc(doc(database, 'users', notification.senderId));
                        const senderName = senderDoc.exists() ? senderDoc.data().name : 'Unknown';
                        const senderImage = senderDoc.exists() ? senderDoc.data().avatar : null;

                        let groupName = 'Unknown Group';
                        let taskName = 'Unknown Task';

                        if (notification.groupId) {
                            // Fetch group's data
                            const groupDoc = await getDoc(doc(database, 'groups', notification.groupId));
                            groupName = groupDoc.exists() ? groupDoc.data().name : 'Unknown Group';
                        }

                        if (notification.taskId) {
                            // Fetch task's data
                            const taskDoc = await getDoc(doc(database, 'tasks', notification.taskId));
                            taskName = taskDoc.exists() ? taskDoc.data().title : 'Unknown Task';
                        }

                        // Calculate time ago
                        const timeAgo = notification.timestamp
                            ? moment(notification.timestamp.toDate()).fromNow()
                            : 'Unknown time';

                        // Determine if the notification is from today
                        const isToday = moment(notification.timestamp.toDate()).isSame(moment(), 'day');

                        notificationsData.push({
                            id: docSnapshot.id,
                            senderName,
                            senderImage,
                            groupName,
                            taskName,
                            timeAgo,
                            message: notification.message,
                            type: notification.groupId ? 'group' : 'task',
                            isToday,
                            timestamp: notification.timestamp.toDate(), // Add timestamp for sorting
                        });
                    }
                }

                // Sort notifications by timestamp in descending order
                notificationsData.sort((a, b) => b.timestamp - a.timestamp);

                setNotifications(notificationsData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching notifications: ", error);
            }
        };

        fetchNotifications();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container1}>
                <ActivityIndicator size="large" color="#FED36A" />
            </SafeAreaView>
        );
    }

    const renderNotification = ({ item }) => (
        <View style={styles.usercont}>
            <Image
                source={item.senderImage ? { uri: item.senderImage } : require('../../assets/avatar.png')}
                style={styles.image}
            />
            <TouchableOpacity>
                <View style={styles.namecont}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.name}>{item.senderName}</Text>
                        <Text style={styles.message}>{item.message}</Text>
                    </View>
                    <Text style={styles.msgtext}>
                        {item.type === 'group' ? item.groupName : item.taskName}
                    </Text>
                </View>
            </TouchableOpacity>
            <View style={styles.timecont}>
                <Text style={styles.time}>{item.timeAgo}</Text>
            </View>
        </View>
    );

    // Split notifications into "New" and "Earlier"
    const newNotifications = notifications.filter(notification => notification.isToday);
    const earlierNotifications = notifications.filter(notification => !notification.isToday);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#212832' }}>
            <View style={styles.container}>
                <View style={styles.headcontainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <AntDesign name="arrowleft" size={wp(6)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Notifications</Text>
                    <View />
                </View>
                {newNotifications.length > 0 && (
                    <View>
                        <Text style={styles.head}>New</Text>
                        <FlatList
                            data={newNotifications}
                            renderItem={renderNotification}
                            keyExtractor={(item) => item.id}
                        />
                    </View>
                )}
                {earlierNotifications.length > 0 && (
                    <View>
                        <Text style={styles.head}>Earlier</Text>
                        <FlatList
                            data={earlierNotifications}
                            renderItem={renderNotification}
                            keyExtractor={(item) => item.id}
                        />
                    </View>
                )}
            </View>
            <View style={styles.bottomcontainer}>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Home')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/home2.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A',fontSize:wp('3%'),fontWeight:'500' }}>Home</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Messages')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/messages.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A',fontSize:wp('3%'),fontWeight:'500' }}>Chat</Text>
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
                        <Text style={{ color: '#617D8A',fontSize:wp('3%'),fontWeight:'500' }}>Calendar</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/notification1.png')} style={styles.home} />
                        <Text style={{ color: '#FED36A',fontSize:wp('3%'),fontWeight:'500' }}>Notification</Text>
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
    container1: {
        flex: 1,
        backgroundColor: '#212832',
        justifyContent: 'center',
        alignItems: 'center',
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
    usercont: {
        width: wp('85%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp('2.5%'),
        justifyContent: 'space-between',
    },
    image: {
        width: wp('12%'),
        height: hp('6%'),
        borderRadius: 25,
    },
    namecont: {
        flexDirection: 'column',
        marginLeft: wp('-20%'),
    },
    name: {
        fontSize: hp('2%'),
        color: '#fff',
        fontWeight: '500',
    },
    msgtext: {
        fontSize: hp('1.5%'),
        color: '#FED36A',
    },
    timecont: {
        flexDirection: 'column',
    },
    time: {
        color: '#fff',
        fontSize: hp('1%'),
    },
    message: {
        color: '#fff',
        fontSize: hp('1%'),
        marginLeft: wp('3%'),
    },
    head: {
        color: '#fff',
        fontSize: hp('2.5%'),
        marginTop: hp('3%'),
    },
});
