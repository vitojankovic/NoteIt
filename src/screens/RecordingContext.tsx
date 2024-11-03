import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

interface Note {
    timestamp: string;
    note: string;
}

export interface RecordingMetadata {
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
            console.log('Document directory:', documentDirectory);

            if (!documentDirectory) {
                console.error('Document directory is not available');
                return;
            }

            const dirs = await FileSystem.readDirectoryAsync(documentDirectory);
            const recordingDirs = dirs.filter(dir => dir.startsWith('recording_'));
            console.log('Recording directories found:', recordingDirs);

            const loadedRecordings: (RecordingMetadata | null)[] = await Promise.all(
                recordingDirs.map(async (dir) => {
                    const metadataPath = `${documentDirectory}${dir}/metadata.json`;
                    console.log('Checking metadata path:', metadataPath);
                    
                    try {
                        const exists = await FileSystem.getInfoAsync(metadataPath);
                        console.log('Metadata exists:', exists.exists, 'for path:', metadataPath);
                        
                        if (exists.exists) {
                            const metadata = await FileSystem.readAsStringAsync(metadataPath);
                            console.log('Loaded metadata:', metadata);
                            return JSON.parse(metadata) as RecordingMetadata;
                        }
                    } catch (error) {
                        console.error(`Failed to read metadata from ${metadataPath}:`, error);
                    }
                    return null;
                })
            );
            
            const filteredRecordings = loadedRecordings.filter(Boolean) as RecordingMetadata[];
            console.log('Final filtered recordings:', filteredRecordings);
            setRecordings(filteredRecordings);
        } catch (error) {
            console.error('Failed to load recordings:', error);
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