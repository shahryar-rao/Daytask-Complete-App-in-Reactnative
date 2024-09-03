import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Font from 'expo-font';
import { useRoute } from '@react-navigation/native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { database,auth } from '../../firebase';
import Checkbox from 'expo-checkbox';

export default function Taskdetail({ navigation }) {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [teamMembersModalVisible, setTeamMembersModalVisible] = useState(false);
    const [teamMembersData, setTeamMembersData] = useState([]);
    const [progress, setProgress] = useState(0);
    const [subtaskName, setSubtaskName] = useState('');
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);



    const route = useRoute();
    const { task } = route.params;
    const teamMembers = task.teamMembers;

    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                'CustomFont': require('../../assets/fonts/PilatExtended-DemiBold.ttf'),
            });
            setFontsLoaded(true);
        };

        loadFonts();
        fetchSubtasks();
    }, []);

    const calculateProgress = (subtasks) => {
        if (subtasks.length === 0) return 0;

        const completedCount = subtasks.filter(subtask => subtask.checked).length;
        return (completedCount / subtasks.length) * 100;
    };

    const handleAddSubtask = async () => {
        if (!subtaskName.trim()) {
            Alert.alert("Please enter a subtask name.");
            return;
        }
        setLoading(true);
        const currentUserId = auth.currentUser.uid;
        const taskRef = doc(database, 'tasks', task.id);

        try {
            const docSnapshot = await getDoc(taskRef);
            const data = docSnapshot.data();
            const subtasks = data?.subtasks || [];

            const newSubtask = {
                name: subtaskName,
                checked: false,
                createrId: currentUserId
            };

            subtasks.push(newSubtask);

            const newProgress = calculateProgress(subtasks);
            await updateDoc(taskRef, {
                subtasks: subtasks,
                progress: newProgress
            });

            setSubtaskName('');
            setModalVisible(false);
            setSubtasks(subtasks);
            setProgress(newProgress);

            await fetchSubtasks();


        } catch (error) {
            console.error("Error adding subtask: ", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubtasks = async () => {
        const taskRef = doc(database, 'tasks', task.id);
        try {
            const docSnapshot = await getDoc(taskRef);
            const data = docSnapshot.data();
            if (data?.subtasks) {
                const subtasksWithNames = await Promise.all(data.subtasks.map(async (subtask) => {
                    const userRef = doc(database, 'users', subtask.createrId);
                    const userSnapshot = await getDoc(userRef);
                    const userData = userSnapshot.data();
                    const creatorName = userData.role === 'admin' ? 'Admin' : userData.name;

                    return {
                        ...subtask,
                        creatorName: creatorName,
                    };
                }));
                setSubtasks(subtasksWithNames);
                setProgress(calculateProgress(subtasksWithNames));
            }

        } catch (error) {
            console.error("Error fetching subtasks: ", error);
        }
    };

    const handleCheckboxChange = async (index) => {
        const updatedSubtasks = [...subtasks];
        updatedSubtasks[index] = {
            ...updatedSubtasks[index],
            checked: !updatedSubtasks[index].checked,
        };

        const newProgress = calculateProgress(updatedSubtasks);

        try {
            const taskRef = doc(database, 'tasks', task.id);
            await updateDoc(taskRef, {
                subtasks: updatedSubtasks,
                progress: newProgress,
            });

            setSubtasks(updatedSubtasks);
            setProgress(newProgress);

        } catch (error) {
            console.error("Error updating task: ", error);
        }
    };

    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.task}>
                <View style={{flexDirection:'column'}}>
                <Text style={styles.tasktext}>{item.name}</Text>
                <Text style={styles.Admin}>{item.creatorName}</Text>
                </View>
                <View style={styles.checkboxcont}>
                    <Checkbox
                        value={item.checked}
                        onValueChange={() => handleCheckboxChange(index)}
                        style={styles.checkbox}
                        color={'#FED36A'}
                    />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#212832' }}>
            <View style={styles.container}>
                <View style={styles.headcontainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <AntDesign name="arrowleft" size={wp(6)} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Task Detail</Text>
                    <View>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="square-edit-outline" size={wp(6)} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.name}>{task.title}</Text>
                <View style={styles.dateteamcont}>
                    <TouchableOpacity>
                        <View style={styles.datebuton}>
                            <Image source={require('../../assets/calendarremove.png')} />
                        </View>
                    </TouchableOpacity>
                    <View style={{ marginLeft: wp('2%') }}>
                        <Text style={styles.duetext}>Due Date</Text>
                        <Text style={styles.date}>{task.date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        setTeamMembersData(teamMembers);
                        setTeamMembersModalVisible(true);
                    }}>
                        <View style={styles.datebuton1}>
                            <Image source={require('../../assets/profile2user.png')} />
                        </View>
                    </TouchableOpacity>
                    <View style={{ marginLeft: wp('2%') }}>
                        <Text style={styles.duetext}>Project Team</Text>
                        <View style={{ flexDirection: 'row', marginLeft: 7 }}>
                            {teamMembers && teamMembers.map(member => (
                                <Image
                                    key={member.id}
                                    source={{ uri: member.avatar }}
                                    style={styles.memberImage}
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <Text style={styles.head}>Project Details</Text>
                <Text style={styles.description}>{task.description}</Text>
                <View style={{ flexDirection: 'row', width: wp('85%'), justifyContent: 'space-between' }}>
                    <Text style={styles.head}>Project Progress</Text>
                    <View>
                        <CircularProgress
                            value={progress}
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
                <Text style={styles.head}>All Tasks</Text>
                <FlatList
                    data={subtasks}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                />
            </View>
            <View style={styles.buttoncont}>
                <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                    <Text style={styles.buttontext}>Add task</Text>
                </TouchableOpacity>
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter new task"
                            value={subtaskName}
                            onChangeText={setSubtaskName}
                        />
                        <TouchableOpacity style={styles.modalButton} onPress={handleAddSubtask}>
                            {loading ? (
                                <ActivityIndicator size="large" color="black" />
                            ) : (
                                <Text style={styles.modalButtonText}>Add Task</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={teamMembersModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setTeamMembersModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Project Team</Text>
                        <ScrollView>
                            {teamMembersData.map((member, index) => (
                                <View key={index} style={styles.teamMemberContainer}>
                                    <Image
                                        source={{ uri: member.avatar }}
                                        style={styles.teamMemberImage}
                                    />
                                    <Text style={styles.teamMemberName}>{member.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setTeamMembersModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
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
    },
    name: {
        fontSize: wp('5%'),
        color: '#fff',
        fontWeight: '600',
        marginTop: hp('7%'),
        fontFamily: 'CustomFont',
    },
    dateteamcont: {
        flexDirection: 'row',
        marginTop: hp('3%'),
        width: wp('85%'),
    },
    datebuton: {
        backgroundColor: '#FED36A',
        height: hp('5%'),
        width: wp('10%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    datebuton1: {
        backgroundColor: '#FED36A',
        height: hp('5%'),
        width: wp('10%'),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: wp('18%'),
    },
    duetext: {
        color: '#8CAAB9',
        fontSize: hp('1.5%'),
    },
    date: {
        color: '#fff',
        fontSize: hp('2%'),
    },
    button: {
        backgroundColor: '#FED36A',
        width: wp('75%'),
        height: hp('7%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttontext: {
        fontSize: hp('2.5%'),
        fontWeight: '700',
        color: 'black',
    },
    image: {
        width: wp('5%'),
        height: hp('2.5%'),
        marginLeft: -7,
    },
    memberImage: {
        height: 20,
        width: 20,
        marginLeft: -7,
        borderRadius: 10,
    },
    head: {
        fontSize: hp('2.2%'),
        color: '#fff',
        fontWeight: '600',
        marginTop: hp('3%'),
    },
    description: {
        fontSize: hp('1.5%'),
        color: '#BCCFD8',
        marginTop: hp('1%'),
        height: hp('9%'),
    },
    buttoncont: {
        width: wp('100%'),
        backgroundColor: '#263238',
        justifyContent: 'center',
        alignItems: 'center',
        height: hp('13%'),
    },
    task: {
        width: wp('85%'),
        backgroundColor: '#455A64',
        height: hp('6.3%'),
        marginTop: hp('1%'),
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tasktext: {
        color: '#fff',
        fontSize: hp('2.2%'),
        marginLeft: wp('5%'),
    },
    checkboxcont: {
        height: hp('4.5%'),
        width: wp('9%'),
        marginRight: wp('3%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkbox: {
        borderRadius: wp('15%'),
        borderColor: 'black',
        width: wp('7%'),
        height: hp('3.5%'),
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: wp('80%'),
        // alignItems: 'center',
    },
    textInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
        padding: 10,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#FED36A',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: hp('2.2%'),
        fontWeight: '600',
        color: '#000',
        marginBottom: hp('2%'),
    },
    teamMemberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    teamMemberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: wp('2%'),
    },
    teamMemberName: {
        fontSize: hp('2%'),
        color: '#000',
    },
    Admin:{
        fontSize: hp('1.5%'),
        color: 'silver',
        marginLeft:wp('5%'),
    },
});
