import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { database } from '../../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CircularProgress from 'react-native-circular-progress-indicator';

export default function SeeallCompleted({ navigation }) {
    const [completed, setCompleted] = useState([]);

    useEffect(() => {
        const tasksRef = collection(database, 'tasks');
        const q = query(tasksRef, where('progress', '==', 100));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const currentDate = new Date();

            const tasks = querySnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const dueDate = data.dateTime ? new Date(data.dateTime.seconds * 1000) : null; 
                    return {
                        id: doc.id,
                        ...data,
                        dueDate: dueDate,
                        date: dueDate ? dueDate.toLocaleDateString() : 'No due date',
                    };
                })
                .sort((a, b) => {
                    if (a.dueDate && b.dueDate) {
                        const diffA = Math.abs(a.dueDate - currentDate);
                        const diffB = Math.abs(b.dueDate - currentDate);
                        return diffA - diffB;
                    }
                    if (a.dueDate) return -1;
                    if (b.dueDate) return 1;  
                    return 0;
                });

            setCompleted(tasks);
        }, (error) => {
            console.error("Error fetching tasks: ", error);
        });

        // Clean up the listener on unmount
        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }) => (
            <View style={styles.ongoingcontainer}>
                <Text style={styles.Ogheading}>{item.title}</Text>
                <Text style={styles.OgTeam}>Team members</Text>

                <View style={styles.imagescontainer1}>
                    {item.teamMembers && item.teamMembers.map(member => (
                        <View key={member.id} style={styles.imageWrapper}>
                            <Image
                                source={{ uri: member.avatar }}
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
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headcontainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <AntDesign name="arrowleft" size={wp(6)} color="white" />
                </TouchableOpacity>
                <Text style={styles.heading}>Completed Tasks</Text>
                <View style={{ height: hp(6), width: wp(6) }}></View>
            </View>
            <View style={{ height: hp('93%'), width: '100%' }}>
                <FlatList
                    data={completed}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                />
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
        width: wp('90%'),
        // marginTop: hp('6%'),
    },
    ongoingcontainer: {
        backgroundColor: '#455A64',
        marginTop: hp('3%'),
        padding: 10,
        width: '100%',
        height: hp('18%'),
        position: 'relative',
    },
    Ogheading: {
        fontSize: wp('5%'),
        fontFamily: 'CustomFont',
        color: '#fff',
        height: hp('7%'),
    },
    OgTeam: {
        fontSize: wp('3.5%'),
        fontWeight: '400',
        color: '#fff',
    },
    imagescontainer1: {
        flexDirection: 'row',
        left: 8,
        marginTop: 5,
    },
    imageWrapper: {
        marginLeft: wp('-1.5%'),
    },
    memberImage: {
        height: hp('2.5%'),
        width: wp('5%'),
        borderRadius: 10,
    },
});
