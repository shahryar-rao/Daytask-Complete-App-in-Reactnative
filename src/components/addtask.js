import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { collection, addDoc, getDocs, setDoc, arrayUnion, Timestamp, doc } from 'firebase/firestore';
import { auth, storage, database } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LogBox } from 'react-native';




LogBox.ignoreLogs(['Warning: Unknown: Support for defaultProps']); // Ignore the specific warning


export default function Addtask({ navigation }) {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false); // State for loader


    const showTimePicker = () => {
        setTimePickerVisibility(true);
    };

    const hideTimePicker = () => {
        setTimePickerVisibility(false);
    };

    const handleConfirmTime = (date) => {
        setSelectedTime(date);
        hideTimePicker();
    };

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirmDate = (date) => {
        setSelectedDate(date);
        hideDatePicker();
    };

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    const handleUserSelect = (user) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        toggleModal();
    };

    const handleCreateTask = async () => {
        if (!taskTitle) {
            Alert.alert("Error", "Task Title is required");
            return;
        }
        setIsLoading(true);

        try {
            const tasksCollection = collection(database, 'tasks');
            const newDocRef = doc(tasksCollection);
            await setDoc(newDocRef, {
                tid: newDocRef.id,
                title: taskTitle,
                description: taskDescription,
                progress: 0,
                teamMembers: selectedUsers.map(user => ({
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                })),
                dateTime: Timestamp.fromDate(new Date(`${moment(selectedDate).format('YYYY-MM-DD')} ${moment(selectedTime).format('HH:mm:ss')}`))
            });

            // Update the taskId array in the users' documents
            const currentUserUid = auth.currentUser.uid;
            const allUsers = [...selectedUsers, { id: currentUserUid }]; // Include current user

            const updateTasksForUsers = allUsers.map(async user => {
                const userDocRef = doc(database, 'users', user.id);
                await setDoc(userDocRef, {
                    taskId: arrayUnion(newDocRef.id) // Add taskId to the user's taskId array
                }, { merge: true });
            });

            await Promise.all(updateTasksForUsers);

            // Create the notification
            const notificationsCollection = collection(database, 'notifications');
            await addDoc(notificationsCollection, {
                senderId: currentUserUid,
                receiverId: selectedUsers.map(user => user.id),
                taskId: newDocRef.id,
                message: 'Added You in Task',
                timestamp: Timestamp.now(),
            });

            Alert.alert("Success", "Task created successfully");
            navigation.navigate('Home');
        } catch (error) {
            console.error("Error creating task: ", error);
            Alert.alert("Error", "Failed to create task");
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(database, 'users');
                const userSnapshot = await getDocs(usersCollection);
                const userList = userSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(userList);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headcontainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <AntDesign name="arrowleft" size={wp(6)} color="white" />
                </TouchableOpacity>
                <Text style={styles.heading}>Create New Task</Text>
                <View style={{ height: hp(6), width: wp(6) }}></View>
            </View>
            <Text style={styles.task}>Task Title</Text>
            <TextInput
                style={styles.input}
                placeholder='Hi-Fi Wireframe'
                placeholderTextColor={'#fff'}
                value={taskTitle}
                onChangeText={setTaskTitle}
            />
            <Text style={styles.task}>Task Details</Text>
            <TextInput
                style={styles.descinput}
                placeholder='Description'
                placeholderTextColor={'#fff'}
                multiline
                value={taskDescription}
                onChangeText={setTaskDescription}
            />
            <Text style={styles.task}>Add team members</Text>
            <View style={styles.addmembers}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedUsers.map(user => (
                        <View key={user.id} style={styles.singlemember}>
                            <Image source={{ uri: user.avatar }} style={styles.memberpic} />
                            <Text style={styles.membername}>{user.name}</Text>
                            <TouchableOpacity onPress={() => {
                                setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                            }}>
                                <Image source={require('../../assets/closesquare.png')} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
                <TouchableOpacity style={styles.addbutton} onPress={toggleModal}>
                    <Image source={require('../../assets/add.png')} style={styles.addlogo} />
                </TouchableOpacity>
            </View>

            <Text style={styles.task}>Time & Date</Text>
            <View style={styles.addmembers}>
                <View style={styles.date}>
                    <TouchableOpacity style={styles.clock} onPress={showTimePicker}>
                        <Image source={require('../../assets/clock.png')} />
                    </TouchableOpacity>
                    <Text style={styles.datetext}>{moment(selectedTime).format('hh:mm A')}</Text>
                </View>
                <View style={styles.date}>
                    <TouchableOpacity style={styles.clock} onPress={showDatePicker}>
                        <Image source={require('../../assets/calendarb.png')} />
                    </TouchableOpacity>
                    <Text style={styles.datetext}>{moment(selectedDate).format('DD/MM/YYYY')}</Text>
                </View>
                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={hideDatePicker}
                    date={selectedDate}
                />
                <DateTimePickerModal
                    isVisible={isTimePickerVisible}
                    mode="time"
                    onConfirm={handleConfirmTime}
                    onCancel={hideTimePicker}
                    date={selectedTime}
                />
            </View>
            <Text style={styles.addtext}>Add New</Text>
            <TouchableOpacity style={styles.button} onPress={handleCreateTask} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                ) : (
                    <Text style={styles.buttontext}>Create</Text>
                )}
            </TouchableOpacity>

            {/* Modal for selecting users */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={toggleModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <FlatList
                        data={users.sort((a, b) => a.name.localeCompare(b.name))} // Sort users alphabetically by name
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => handleUserSelect(item)}
                            >
                                <Image source={{ uri: item.avatar }} style={styles.modalUserPic} />
                                <Text style={styles.modalUserName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>
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
        width: wp('90%'),
    },
    task: {
        fontSize: wp('4%'),
        color: '#fff',
        fontWeight: '600',
        marginTop: hp('4%'),
    },
    addtext: {
        fontSize: wp('4%'),
        color: '#fff',
        fontWeight: '600',
        marginTop: hp('4%'),
        alignSelf: 'center',
    },
    input: {
        height: hp('6%'),
        width: wp('85%'),
        backgroundColor: '#455A64',
        padding: 15,
        marginTop: hp('2%'),
        color: '#fff',
    },
    descinput: {
        height: hp('12%'),
        width: wp('85%'),
        backgroundColor: '#455A64',
        padding: 15,
        marginTop: hp('2%'),
        color: '#fff',
    },
    addmembers: {
        width: wp('85%'),
        height: hp('6%'),
        marginTop: hp('2%'),
        flexDirection: 'row',
    },
    addbutton: {
        backgroundColor: '#FED36A',
        height: hp('6%'),
        width: wp('12%'),
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
    },
    singlemember: {
        height: hp('6%'),
        width: wp('35%'),
        backgroundColor: '#455A64',
        padding: 10,
        marginRight: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberpic: {
        height: hp('3%'),
        width: hp('3%'),
        borderRadius: 15,
    },
    membername: {
        fontSize: hp('2%'),
        color: '#FFF',
        marginLeft: -15,
    },
    date: {
        width: wp('42%'),
        height: hp('6%'),
        flexDirection: 'row',
        backgroundColor: '#455A64',
        marginRight: 5,
    },
    clock: {
        height: hp('6%'),
        width: wp('12%'),
        backgroundColor: '#FED36A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    datetext: {
        fontSize: hp('2%'),
        alignSelf: 'center',
        color: '#fff',
        marginLeft: 8,
    },
    button: {
        backgroundColor: '#FED36A',
        width: wp('85%'),
        height: hp('8%'),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp('3%'),
    },
    buttontext: {
        fontSize: hp('2.5%'),
        fontWeight: '700',
        color: 'black',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#212832',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#455A64',
        marginVertical: 5,
        borderRadius: 10,
        width: wp('80%'),
    },
    modalUserPic: {
        height: hp('5%'),
        width: hp('5%'),
        borderRadius: hp('2.5%'),
    },
    modalUserName: {
        fontSize: hp('2%'),
        color: '#fff',
        marginLeft: 10,
    },
});
