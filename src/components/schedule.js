import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Modal, TouchableHighlight } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { collection, getDocs,doc , query,getDoc,where } from 'firebase/firestore';
import { database, auth } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFocusEffect } from '@react-navigation/native';

const monthsArray = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

export default function Schedule({ navigation }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [modalVisible, setModalVisible] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const [tasks, setTasks] = useState([]);
    const [filteredTask, setFilteredTask] = useState([]);

    const datesArray = Array.from({ length: daysInMonth(selectedMonth + 1, selectedYear) }, (_, i) => i + 1);

    const data = datesArray.map((date) => ({
        date,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(selectedYear, selectedMonth, date).getDay()]
    }));

    const flatListRef = useRef(null);


    const fetchTasks = useCallback(async () => {
        const currentUser = auth.currentUser;
    
        if (currentUser) {
            try {
                // Get the current user's document
                const userDocRef = doc(database, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.data().role === 'admin') {
                    setIsAdmin(true); // Set isAdmin to true if the user's role is admin
                }
    
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const taskIds = userData.taskId || []; // Get the taskId array
    
                    if (taskIds.length > 0) {
                        // Query the tasks collection to get the tasks with the corresponding taskIds
                        const tasksCollection = collection(database, 'tasks');
                        const tasksQuery = query(tasksCollection, where('tid', 'in', taskIds));
    
                        const tasksSnapshot = await getDocs(tasksQuery);
                        const tasksList = tasksSnapshot.docs.map(doc => {
                            const taskData = doc.data();
                            const dateTime = taskData.dateTime;
    
                            const formattedDate = dateTime ? dateTime.toDate() : null;
    
                            return {
                                id: doc.id,
                                ...taskData,
                                date: formattedDate,
                            };
                        });
    
                        setTasks(tasksList);
                    }
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        }
    }, []);
    
    

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [fetchTasks])
    );

    useEffect(() => {
        const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDate);
        filterTask(selectedDateObj);
    }, [selectedDate, selectedYear, selectedMonth, tasks]);

    const filterTask = (date) => {
        const filteredTasks = tasks.filter(task => {
            if (task.date) {
                return (
                    task.date.getFullYear() === date.getFullYear() &&
                    task.date.getMonth() === date.getMonth() &&
                    task.date.getDate() === date.getDate()
                );
            }
            return false;
        });
        setFilteredTask(filteredTasks);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const renderDateItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleDateSelect(item.date)}>
            <View style={[styles.datecont, item.date === selectedDate && styles.selectedDatecont]}>
                <Text style={[styles.nmbrdate, item.date === selectedDate && styles.selectedDate]}>{item.date}</Text>
                <Text style={[styles.day, item.date === selectedDate && styles.selectedDate]}>{item.day}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderTaskItem = ({ item, index }) => {
        const container = index === 0 ? styles.task1 : styles.task;
        const name = index === 0 ? styles.name1 : styles.name;
        const time = index === 0 ? styles.time1 : styles.time;

        return (
            <View style={container}>
                <View style={styles.yellowline} />
                <View style={{ flexDirection: 'column', marginLeft: wp('3%') }}>
                    <Text style={name}>{item.title}</Text>
                    <Text style={time}>{item.dateTime?.toDate().toLocaleTimeString()}</Text>
                </View>
                <View style={styles.imagecont}>
                    {item.teamMembers && item.teamMembers.map(member => (
                        <View key={member.id}>
                            <Image
                                source={{ uri: member.avatar }}
                                style={styles.memberImage}
                            />
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const handleMonthChange = (index) => {
        setSelectedMonth(index);
        setSelectedDate(1); // Reset to the 1st of the new month
        setModalVisible(false);
    
        const newDate = new Date(selectedYear, index, 1); // Use the 1st of the selected month and year
        filterTask(newDate); // Filter tasks for the 1st day of the selected month
    };
    

    const getItemLayout = (data, index) => (
        { length: wp('12%'), offset: wp('12%') * index, index }
    );

    const onScrollToIndexFailed = (info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
        });
    };

    useEffect(() => {
        const selectedIndex = datesArray.indexOf(selectedDate);
        if (flatListRef.current && selectedIndex !== -1) {
            flatListRef.current.scrollToIndex({ index: selectedIndex, animated: true });
        }
    }, [selectedDate]);

    return (
        <SafeAreaView style={{ flex: 1,backgroundColor:'#212832' }}>
            <View style={styles.container}>
                <View style={styles.headcontainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <AntDesign name="arrowleft" size={wp(6)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Schedule</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Feather name="plus-square" size={wp(6)} color="white" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.month}>{monthsArray[selectedMonth]}</Text>
                <View style={{ marginTop: hp('3%') }}>
                    <FlatList
                        ref={flatListRef}
                        data={data}
                        renderItem={renderDateItem}
                        keyExtractor={(item) => item.date.toString()}
                        horizontal
                        getItemLayout={getItemLayout}
                        onScrollToIndexFailed={onScrollToIndexFailed}
                    />
                </View>
                <Text style={styles.month}>Today’s Tasks</Text>
                <View style={{ marginBottom: hp('46%') }}>
                    <FlatList
                        data={filteredTask}
                        renderItem={renderTaskItem}
                        keyExtractor={(item) => item.id}
                        style={{ marginTop: hp('3%') }}
                        ListEmptyComponent={<Text style={styles.noTasks}>No tasks for this date</Text>}
                    />
                </View>
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
                <TouchableOpacity style={styles.bottomicon} onPress={isAdmin ?() => navigation.navigate('Addtask'):null}>
                    <View style={styles.bottombutton1}>
                        <Image source={require('../../assets/add.png')} style={styles.home} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/calendaryel.png')} style={styles.home} />
                        <Text style={{ color: '#FED36A',fontSize:wp('3%'),fontWeight:'500' }}>Calendar</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Notification')}>
                    <View style={styles.bottombutton}>
                        <Image source={require('../../assets/notification.png')} style={styles.home} />
                        <Text style={{ color: '#617D8A',fontSize:wp('3%'),fontWeight:'500' }}>Notification</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {monthsArray.map((month, index) => (
                            <TouchableHighlight
                                key={index}
                                onPress={() => handleMonthChange(index)}
                                style={styles.modalItem}
                            >
                                <Text style={styles.modalText}>{month}</Text>
                            </TouchableHighlight>
                        ))}
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
    month: {
        color: 'white',
        fontSize: wp('5%'),
        fontWeight: '600',
        marginTop: hp('5%'),
    },
    datecont: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#263238',
        height: hp('9%'),
        width: wp('10%'),
        marginRight: wp('2%'),
    },
    selectedDatecont: {
        backgroundColor: '#FED36A',
    },
    selectedDate: {
        color: 'black',
    },
    nmbrdate: {
        color: '#fff',
        fontSize: wp('5%'),
        fontWeight: '500',
    },
    day: {
        color: '#fff',
        fontSize: wp('3%'),
        fontWeight: '500',
    },
    task: {
        backgroundColor: '#263238',
        height: hp('10%'),
        width: wp('85%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    task1: {
        backgroundColor: '#FED36A',
        height: hp('10%'),
        width: wp('85%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    name: {
        color: '#fff',
        fontSize: wp('5%'),
        fontWeight: '600',
    },
    name1: {
        color: 'black',
        fontSize: wp('5%'),
        fontWeight: '600',
    },
    time: {
        color: '#fff',
        fontSize: wp('3%'),
        marginTop: hp('1%'),
    },
    time1: {
        color: 'black',
        fontSize: wp('3%'),
        marginTop: hp('1%'),
    },
    imagecont: {
        marginRight: wp('3%'),
        flexDirection: 'row',
        right: wp('2%'),
        position: 'absolute',
    },
    memberImage: {
        width: wp('6%'),
        height: hp('3%'),
        marginLeft: -7,
        borderRadius: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: wp('80%'),
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalItem: {
        padding: 10,
        width: '100%',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    modalText: {
        fontSize: wp('4%'),
        color: '#333',
    },
    yellowline: {
        height: hp('10%'),
        width: wp('3%'),
        backgroundColor: '#FED36A',
    },
    noTasks: {
        color: '#fff',
        textAlign: 'center',
        marginTop: hp('5%'),
        fontSize: wp('4%'),
    },
});
