import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

interface Note {
    timestamp: string;
    note: string;
}

interface RecordingMetadata {
    name: string;
    notes: Note[];
    audioPath: string;
}

interface RecordingContextType {
    recordings: RecordingMetadata[];
    loadRecordings: () => Promise<void>;
    deleteRecording: (audioPath: string) => Promise<void>;
    addRecording: (newRecording: RecordingMetadata) => Promise<void>;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);

    const loadRecordings = async () => {
        try {
            const documentDirectory = FileSystem.documentDirectory;
            if (!documentDirectory) {
                console.error('Document directory is not available');
                return;
            }
    
            console.log('Document directory:', documentDirectory);
            const dirs = await FileSystem.readDirectoryAsync(documentDirectory);
            console.log('Found directories:', dirs);
            const loadedRecordings = [];
    
            for (const dir of dirs) {
                // Only process directories that start with "recording_" and contain a hyphen, to filter out other files
                if (!dir.startsWith('recording_') || !dir.includes('-')) continue;
    
                try {
                    const dirPath = `${documentDirectory}${dir}`;
                    const dirExists = await FileSystem.getInfoAsync(dirPath);
    
                    if (!dirExists.exists || !dirExists.isDirectory) {
                        console.warn(`Skipping ${dirPath}: Not a valid directory.`);
                        continue;
                    }
    
                    const metadataPath = `${dirPath}/metadata.json`;
                    const metadataExists = await FileSystem.getInfoAsync(metadataPath);
    
                    if (!metadataExists.exists) {
                        console.warn(`Missing metadata at ${metadataPath}. Deleting directory ${dirPath}.`);
                        await FileSystem.deleteAsync(dirPath, { idempotent: true });
                        continue;
                    }
    
                    const metadata = await FileSystem.readAsStringAsync(metadataPath);
                    const parsedMetadata = JSON.parse(metadata);
    
                    // Check if audio file exists
                    const audioExists = await FileSystem.getInfoAsync(parsedMetadata.audioPath);
                    if (!audioExists.exists) {
                        console.warn(`Missing audio file at ${parsedMetadata.audioPath}. Deleting directory ${dirPath}.`);
                        await FileSystem.deleteAsync(dirPath, { idempotent: true });
                        continue;
                    }
    
                    // If everything is valid, add to loaded recordings
                    loadedRecordings.push(parsedMetadata);
                    console.log(`Successfully loaded recording from ${dir}`);
                } catch (error) {
                    console.error(`Error processing directory ${dir}:`, error);
                    // Optionally, delete the problematic directory if errors keep occurring
                    await FileSystem.deleteAsync(`${documentDirectory}${dir}`, { idempotent: true });
                }
            }
    
            setRecordings(loadedRecordings);
            console.log('Total recordings loaded:', loadedRecordings.length);
        } catch (error) {
            console.error('Error loading recordings:', error);
        }
    };
    

    const addRecording = async (newRecording: RecordingMetadata) => {
        try {
            const { name, notes, audioPath } = newRecording;
            
            const dirPath = `${FileSystem.documentDirectory}recording_${name}_${Date.now()}`;
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });

            const metadataPath = `${dirPath}/metadata.json`;
            await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(newRecording));

            // If audioPath is a base64 string, decode and save it
            if (newRecording.audioPath.startsWith('data:audio')) {
                const audioFileName = `${name}_${Date.now()}.mp3`;
                const newAudioPath = `${dirPath}/${audioFileName}`;
                const base64Data = newRecording.audioPath.split(',')[1];
                await FileSystem.writeAsStringAsync(newAudioPath, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                newRecording.audioPath = newAudioPath;
            }

            setRecordings(prevRecordings => [...prevRecordings, newRecording]);
            console.log(`Successfully added recording: ${name}`);
        } catch (err) {
            console.log("Error adding recording: ", err);
        }
    };

    const deleteRecording = async (audioPath: string) => {
        try {
            const dirPath = audioPath.substring(0, audioPath.lastIndexOf('/'));
            await FileSystem.deleteAsync(dirPath, { idempotent: true });
            setRecordings(prevRecordings => 
                prevRecordings.filter(recording => recording.audioPath !== audioPath)
            );
            console.log(`Successfully deleted recording at ${audioPath}`);
        } catch (error) {
            console.error('Error deleting recording:', error);
        }
    };

    useEffect(() => {
        loadRecordings();
    }, []);

    return (
        <RecordingContext.Provider value={{ recordings, loadRecordings, deleteRecording, addRecording }}>
            {children}
        </RecordingContext.Provider>
    );
};

export const useRecordingContext = () => {
    const context = useContext(RecordingContext);
    if (!context) {
        throw new Error('useRecordingContext must be used within a RecordingProvider');
    }
    return context;
};