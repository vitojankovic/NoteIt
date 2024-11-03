import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useRecordingContext, RecordingMetadata } from './RecordingContext';

const Library: React.FC = () => {
    const { recordings } = useRecordingContext();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playingPath, setPlayingPath] = useState<string | null>(null);

    useEffect(() => {
        console.log('Recordings in Library:', recordings);
    }, [recordings]);

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const playRecording = async (audioPath: string) => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioPath },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);
            setPlayingPath(audioPath);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status && 'didJustFinish' in status && status.didJustFinish) {
                    setIsPlaying(false);
                    setPlayingPath(null);
                }
            });

            await newSound.playAsync();
        } catch (error) {
            console.error('Error playing recording:', error);
        }
    };

    const stopPlayback = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
            setPlayingPath(null);
        }
    };

    const renderItem = ({ item }: { item: RecordingMetadata }) => {
        console.log('Rendering item:', item);
        return (
            <View style={styles.recordingItem}>
                <Text style={styles.recordingPath}>Recording: {item.audioPath}</Text>
                <View style={styles.playbackControls}>
                    <Button
                        title={playingPath === item.audioPath ? "Stop" : "Play"}
                        onPress={() => 
                            playingPath === item.audioPath 
                                ? stopPlayback() 
                                : playRecording(item.audioPath)
                        }
                    />
                </View>
                <Text style={styles.notesHeader}>Notes:</Text>
                {item.notes.map((note) => (
                    <View key={note.timestamp} style={styles.noteItem}>
                        <Text style={styles.noteTimestamp}>
                            {new Date(note.timestamp).toLocaleString()}
                        </Text>
                        <Text style={styles.noteText}>{note.note}</Text>
                    </View>
                ))}
            </View>
        );
    };

    console.log('Library render, recordings length:', recordings.length);

    return (
        <View style={styles.container}>
            {recordings.length === 0 ? (
                <Text>No recordings found</Text>
            ) : (
                <FlatList
                    data={recordings}
                    keyExtractor={(item) => item.audioPath}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    recordingItem: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    recordingPath: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    playbackControls: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 8,
    },
    notesHeader: {
        fontWeight: 'bold',
        marginVertical: 4,
    },
    noteItem: {
        marginLeft: 8,
        marginVertical: 4,
    },
    noteTimestamp: {
        fontSize: 12,
        color: '#666',
    },
    noteText: {
        marginTop: 2,
    },
});

export default Library;
