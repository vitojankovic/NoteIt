import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

interface Note {
    timestamp: string;
    note: string;
}

interface RecordingMetadata {
    notes: Note[];
    audioPath: string;
}

interface RecordingContextType {
    recordings: RecordingMetadata[];
    loadRecordings: () => Promise<void>;
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
        const loadedRecordings: RecordingMetadata[] = [];

        for (const dir of dirs) {
            // Skip non-recording directories and files
            if (!dir.startsWith('recording_') || !dir.includes('-')) continue;

            try {
                const dirPath = `${documentDirectory}${dir}`;
                // First check if the directory exists and is readable
                const dirExists = await FileSystem.getInfoAsync(dirPath);
                if (!dirExists.exists) {
                    console.log(`Directory doesn't exist: ${dirPath}`);
                    continue;
                }

                const metadataPath = `${dirPath}/metadata.json`;
                console.log('Checking metadata path:', metadataPath);
                
                const metadataExists = await FileSystem.getInfoAsync(metadataPath);
                if (!metadataExists.exists) {
                    console.log(`No metadata found at ${metadataPath}`);
                    continue;
                }

                const metadata = await FileSystem.readAsStringAsync(metadataPath);
                const parsedMetadata = JSON.parse(metadata) as RecordingMetadata;
                
                // Verify audio file exists
                const audioExists = await FileSystem.getInfoAsync(parsedMetadata.audioPath);
                if (!audioExists.exists) {
                    console.log(`Audio file missing at ${parsedMetadata.audioPath}`);
                    continue;
                }

                loadedRecordings.push(parsedMetadata);
                console.log(`Successfully loaded recording from ${dir}`);
            } catch (error) {
                console.error(`Error processing directory ${dir}:`, error);
                continue; // Skip this directory and continue with others
            }
        }

        setRecordings(loadedRecordings);
        console.log('Total recordings loaded:', loadedRecordings.length);
    } catch (error) {
        console.error('Error loading recordings:', error);
    }
};

    useEffect(() => {
        loadRecordings();
    }, []);

    return (
        <RecordingContext.Provider value={{ recordings, loadRecordings }}>
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