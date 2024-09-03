import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, ActivityIndicator, TextInput, TouchableOpacity, FlatList, Modal, Pressable, KeyboardAvoidingView } from 'react-native';
import * as Font from 'expo-font';
import { auth, database } from '../../firebase';
import { doc, getDoc, onSnapshot, query, where, getDocs, collection } from '@firebase/firestore';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircularProgress from 'react-native-circular-progress-indicator';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Timestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import FontAwesome from '@expo/vector-icons/FontAwesome';





export default function Home({ navigation }) {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [user, setUser] = useState(null);
    const [ongoingData, setOngoingData] = useState([]);
    const [imageCacheBuster, setImageCacheBuster] = useState(Date.now()); // Cache busting timestamp
    const [completedData, setCompletedData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOngoingData, setFilteredOngoingData] = useState([]);
    const [filteredCompletedData, setFilteredCompletedData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
    const [filterOption, setFilterOption] = useState('');
    const [companyName, setCompanyName] = useState(); // State for company name
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);



    // Load fonts
    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                'CustomFont': require('../../assets/fonts/PilatExtended-DemiBold.ttf'),
            });
            setFontsLoaded(true);
        };

        loadFonts();
    }, []);

    // Fetch user data and set up listener
    useFocusEffect(
        useCallback(() => {
            const currentUser = auth.currentUser;

            if (currentUser) {
                const userId = currentUser.uid;
                const userDoc = doc(database, 'users', userId);

                const fetchUserData = async () => {
                    const docSnap = await getDoc(userDoc);
                    if (docSnap.exists()) {
                        setUser(docSnap.data());
                        if (docSnap.data().role === 'admin') {
                            setIsAdmin(true); // Set isAdmin to true if the user's role is admin
                        }
                        // Fetch company name
                        const { companyId } = docSnap.data();
                        if (companyId) {
                            const companyDoc = doc(database, 'companies', companyId);
                            const companySnap = await getDoc(companyDoc);
                            if (companySnap.exists()) {
                                setCompanyName(companySnap.data().name);
                            } else {
                                console.log('No such company document!');
                            }
                        }
                        setImageCacheBuster(Date.now());
                    } else {
                        console.log('No such document!');
                    }
                };
                fetchUserData();

                const unsubscribe = onSnapshot(userDoc, (doc) => {
                    if (doc.exists()) {
                        setUser(doc.data());
                        setImageCacheBuster(Date.now());
                    }
                });

                return () => unsubscribe();
            } else {
                console.log('No user is currently logged in.');
            }
        }, [])
    );

    const fetchTasks = useCallback(async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                console.log('No user is currently logged in.');
                return;
            }
            const userId = currentUser.uid;
            const userDoc = doc(database, 'users', userId);
            const docSnap = await getDoc(userDoc);

            if (!docSnap.exists()) {
                console.log('No such document!');
                return;
            }

            const userData = docSnap.data();
            const taskIds = userData.taskId || [];
            if (taskIds.length === 0) {
                setOngoingData([]); // Clear existing data if no task IDs
                setCompletedData([]);
                return;
            }

            // Query tasks based on the task IDs
            const tasksQuery = query(
                collection(database, 'tasks'),
                where('tid', 'in', taskIds)
            );

            const querySnapshot = await getDocs(tasksQuery);
            const tasksList = querySnapshot.docs.map(doc => {
                const taskData = doc.data();
                const dateTime = taskData.dateTime;

                const date = dateTime ? dateTime.toDate().toLocaleDateString() : null;

                return {
                    id: doc.id,
                    ...taskData,
                    date: date
                };
            });

            // Sort tasks by date in descending order
            const sortedTasks = tasksList.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Separate ongoing and completed tasks
            const ongoingTasks = sortedTasks.filter(task => task.progress < 100).slice(0, 5); // Get 5 latest ongoing tasks
            const completedTasks = sortedTasks.filter(task => task.progress === 100).slice(0, 3); // Get 3 latest completed tasks

            setOngoingData(ongoingTasks);
            setCompletedData(completedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }, [auth.currentUser]);



    // Function to refresh the screen
    const handleRefresh = async () => {
        setLoading(true); // Set loading to true when refresh starts
        await fetchTasks();
        setLoading(false); // Set loading to false once data is fetched
    };
    
    



    useFocusEffect(
        useCallback(() => {
            fetchTasks();
        }, [fetchTasks])
    );
    useEffect(() => {
        const filterTasks = () => {
            let filteredOngoing = ongoingData;
            let filteredCompleted = completedData;

            if (searchQuery) {
                // Apply search query filter
                filteredOngoing = filteredOngoing.filter(task =>
                    task.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                filteredCompleted = filteredCompleted.filter(task =>
                    task.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (filterOption === 'app') {
                filteredOngoing = filteredOngoing.filter(task =>
                    task.title.toLowerCase().includes('app')
                );
                filteredCompleted = filteredCompleted.filter(task =>
                    task.title.toLowerCase().includes('app')
                );
            } else if (filterOption === 'web') {
                filteredOngoing = filteredOngoing.filter(task =>
                    task.title.toLowerCase().includes('web')
                );
                filteredCompleted = filteredCompleted.filter(task =>
                    task.title.toLowerCase().includes('web')
                );
            } else if (filterOption === 'latest') {
                filteredOngoing = filteredOngoing.slice().sort((a, b) => b.date - a.date);
                filteredCompleted = filteredCompleted.slice().sort((a, b) => b.date - a.date);
            }

            setFilteredOngoingData(filteredOngoing);
            setFilteredCompletedData(filteredCompleted);
        };

        filterTasks();
    }, [searchQuery, ongoingData, completedData, filterOption]);

    useEffect(() => {
        if (!searchQuery) {
            setFilterOption('');
        }
    }, [searchQuery]);


    if (!fontsLoaded || !user) {
        return (
            <SafeAreaView style={styles.container1}>
                <ActivityIndicator size="large" color="#FED36A" />
            </SafeAreaView>
        );
    };

    const ListEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nothing to show</Text>
        </View>
    );

    const ongoingrenderitem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('Taskdetail', { task: item })}>
            <View style={styles.ongoingcontainer}>
                <Text style={styles.Ogheading}>{item.title}</Text>
                <Text style={styles.OgTeam}>Team members</Text>

                <View style={styles.imagescontainer1}>
                    {item.teamMembers && item.teamMembers.map(member => (
                        <View key={member.id} >
                            <Image
                                source={{ uri: `${member.avatar}?t=${imageCacheBuster}` }} // Cache-busting
                                style={styles.memberImage}
                            />
                        </View>
                    ))}
                </View>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '400', marginTop: 10 }}>
                    Due on: {item.date}
                </Text>
                <View style={{ position: 'absolute', right: 10, bottom: 10 }}>
                    <CircularProgress
                        value={item.progress ?? 0}
                        radius={30}
                        inActiveStrokeColor={'#fff'}
                        inActiveStrokeOpacity={0}
                        activeStrokeColor={'#FED36A'}
                        activeStrokeWidth={2}
                        progressValueColor={'#fff'}
                        valueSuffix={'%'}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderItem = ({ item, index }) => {
        const container = index === 0 ? styles.completedtasks : styles.completedtasks1;
        const heading = index === 0 ? styles.mainheading : styles.mainheading1;
        const member = index === 0 ? styles.teammember : styles.teammember1;
        const progress = index === 0 ? styles.progressText : styles.progressText1;
        return (
            <TouchableOpacity onPress={() => navigation.navigate('Taskdetail', { task: item })}>
                <View style={container}>
                    <Text style={heading}>
                        {item.title}
                    </Text>
                    <Text style={member}>Team members</Text>
                    <View style={styles.imagescontainer}>
                        {item.teamMembers && item.teamMembers.map(member => (
                            <View key={member.id} >
                                <Image
                                    source={{ uri: `${member.avatar}?t=${imageCacheBuster}` }}
                                    style={styles.memberImage}
                                />
                            </View>
                        ))}
                    </View>
                    <View style={{ top: 10, }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', bottom: 4, }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: index === 0 ? 'black' : 'white', }}>Completed</Text>
                            <Text style={progress}>{item.progress}%</Text></View>
                        {index === 0 ? (
                            <Progress.Bar
                                progress={item.progress}
                                width={170}
                                color="black"
                                borderWidth={0}
                            />
                        ) : (
                            <Progress.Bar
                                progress={item.progress}
                                width={170}
                                color="white"
                                borderWidth={0}
                            />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView behavior='static' style={{ flex: 1, backgroundColor: '#212832' }}>
            {/* <StatusBar style='auto'/> */}
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <View style={styles.heading}>
                        <View style={styles.namecontainer}>
                            <Text style={styles.welcome}>Welcome Back!</Text>
                            <Text style={styles.name}>{user.name}</Text>
                        </View>
                        <Text style={styles.name1}>{companyName}</Text>
                        <View style={{flexDirection:'row'}}>
                        <TouchableOpacity style={styles.refresh} onPress={handleRefresh}>
                        <FontAwesome name="refresh" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                            <Image
                                source={user.avatar ? { uri: `${user.avatar}` } : require('../../assets/avatar.png')}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.SearchContainer}>
                        <View style={styles.search}>
                            <Image source={require('../../assets/search.png')} style={styles.searchlogo} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder='Search tasks'
                                placeholderTextColor={'#6F8793'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <View style={styles.filtercontainer} >
                                <Image source={require('../../assets/filter.png')} style={styles.filter} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.completetaskcon}>
                        <Text style={styles.completetask}>Completed Tasks</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SeeallCompleted')}>
                            <Text style={{ color: '#FED36A', fontSize: 18, fontWeight: '400', }}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#FED36A" />
                    </View>
                ) : (
                    
                        <View style={{ height: '30%' }}>
                            <FlatList
                                horizontal
                                data={filteredCompletedData}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                ListEmptyComponent={ListEmptyComponent}
                                showsHorizontalScrollIndicator={false}
                            />
                        </View>
                    )}

                        <View style={styles.completetaskcon1}>
                            <Text style={styles.completetask}>Ongoing Projects</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Seeallongoing')}>
                                <Text style={{ color: '#FED36A', fontSize: 18, fontWeight: '400', }}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#FED36A" />
                    </View>
                ) : (
                        <View style={{ height: hp('29%'), width: '100%' }}>
                            <FlatList
                                data={filteredOngoingData}
                                renderItem={ongoingrenderitem}
                                keyExtractor={item => item.id}
                                ListEmptyComponent={ListEmptyComponent}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    
                )}
                    <Modal
                        visible={modalVisible}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Select Filter Option</Text>
                                <Pressable
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setFilterOption('app');
                                        setSearchQuery('App'); // Update searchQuery to show in TextInput
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>App</Text>
                                </Pressable>
                                <Pressable
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setFilterOption('web');
                                        setSearchQuery('web'); // Update searchQuery to show in TextInput
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Web</Text>
                                </Pressable>
                                <Pressable
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setFilterOption('latest');
                                        // setSearchQuery('latest'); 
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Latest</Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </Modal>
                </View>
                <View style={styles.bottomcontainer}>
                    <TouchableOpacity style={styles.bottomicon}>
                        <View style={styles.bottombutton}>
                            <Image source={require('../../assets/home.png')} style={styles.home} />
                            <Text style={{ color: '#FED36A', fontSize: wp('3%'), fontWeight: '500' }}>Home</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Messages')}>
                        <View style={styles.bottombutton}>
                            <Image source={require('../../assets/messages.png')} style={styles.home} />
                            <Text style={{ color: '#617D8A', fontSize: wp('3%'), fontWeight: '500' }}>Chat</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomicon} onPress={isAdmin ?() => navigation.navigate('Addtask'):null}>
                        <View style={styles.bottombutton1}>
                            <Image source={require('../../assets/add.png')} style={styles.home} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Schedule')}>
                        <View style={styles.bottombutton}>
                            <Image source={require('../../assets/calendar.png')} style={styles.home} />
                            <Text style={{ color: '#617D8A', fontSize: wp('3%'), fontWeight: '500' }}>Calendar</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomicon} onPress={() => navigation.navigate('Notification')}>
                        <View style={styles.bottombutton}>
                            <Image source={require('../../assets/notification.png')} style={styles.home} />
                            <Text style={{ color: '#617D8A', fontSize: wp('3%'), fontWeight: '500' }}>Notification</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212832',
        alignItems: 'center',
        padding: 28,
        marginBottom: -26,
    },
    container1: {
        flex: 1,
        backgroundColor: '#212832',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    heading: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    namecontainer: {
        flexDirection: 'column',
    },
    welcome: {
        color: '#FED36A',
        fontSize: wp('3.5%'),
        fontWeight: '500',
    },
    name: {
        fontFamily: 'CustomFont',
        fontSize: wp('6%'),
        fontWeight: '600',
        color: '#fff',
    },
    name1: {
        fontFamily: 'CustomFont',
        fontSize: wp('3%'),
        fontWeight: '600',
        color: '#fff',
        marginLeft:wp('-12%'),
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    SearchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 25,
        height: hp('6%'),

    },
    search: {
        flexDirection: 'row',
        width: '80%',
        backgroundColor: '#455A64',
        height: hp('6%'),
    },
    searchInput: {
        width: '83%',
        backgroundColor: '#455A64',
        height: hp('6%'),
        color: '#fff'
    },
    searchlogo: {
        width: wp('5%'),
        height: hp('2.5%'),
        alignSelf: 'center',
        marginRight: wp('5%'),
        left: wp('3%'),
    },
    filtercontainer: {
        backgroundColor: '#FED36A',
        width: wp('13%'),
        height: hp('6%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    filter: {
        width: wp('4.4%'),
        height: hp('2.2%'),
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
    completetaskcon: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 30,
        alignItems: 'center',
    },
    completetaskcon1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',

    },
    completetask: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    completedtasks: {
        paddingVertical: 15,
        backgroundColor: '#FED36A',
        marginRight: 7,
        marginTop: 15,
        paddingHorizontal: 7,
        height: hp('22%'),
        width: wp('48%')
    },
    completedtasks1: {
        paddingVertical: 15,
        backgroundColor: '#455A64',
        marginRight: 7,
        marginTop: 15,
        paddingHorizontal: 7,
        height: hp('22%'),
        width: wp('48%')
    },
    mainheading: {
        fontSize: 21,
        fontWeight: '600',
        color: 'black',
        fontFamily: 'CustomFont',
        height: hp('10%')
    },
    mainheading1: {
        fontSize: 21,
        fontWeight: '600',
        color: 'white',
        fontFamily: 'CustomFont',
        height: hp('10%')

    },
    teammember: {
        fontSize: 12,
        fontWeight: '500',
        top: 15,
    },
    teammember1: {
        fontSize: 12,
        fontWeight: '500',
        top: 15,
        color: '#fff',
    },
    imagescontainer: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        marginRight: wp('2%'),
    },
    imagescontainer1: {
        flexDirection: 'row',
        left: 8,
        marginTop: 5,
        // alignSelf: 'flex-end',
    },
    memberImage: {
        height: hp('2.8%'),
        width: wp('5.4%'),
        marginLeft: wp('-1.5%'),
        borderRadius: 10,
    },
    progressText: {
        fontWeight: '600',

    },
    progressText1: {
        fontWeight: '600',
        color: '#fff'
        ,
    },
    ongoingcontainer: {
        backgroundColor: '#455A64',
        marginTop: 20,
        // height:140,
        padding: 10,
        width: '100%',
        height: hp('18%')

    },
    Ogheading: {
        fontSize: 20,
        fontFamily: 'CustomFont',
        color: '#fff',
        height: hp('7%')
    },
    OgTeam: {
        fontSize: 14,
        fontWeight: '400',
        color: '#fff',
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
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderRadius: 10,
        padding: 20,
        width: '45%',
        alignItems: 'center',
        marginTop: hp('21%'),
        marginRight: wp('7%'),
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
        width: wp('25%'),
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'black',
        fontSize: 16,
    },
    emptyText: {
        color: '#fff',
        fontSize: wp('4%'),
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        // justifyContent:'center',
        marginTop: hp('12%')
        // alignContent:'center',
    },
    refresh:{
        marginTop:hp('1.5%'),
        marginRight:wp('5%'),
    },
    loaderContainer:{
        justifyContent:'center',
        alignItems:'center',
        height:hp('29%'),
    },
});
