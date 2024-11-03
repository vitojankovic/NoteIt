import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const Export = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const audioFiles = [
        { id: '1', title: 'Audio 1' },
        { id: '2', title: 'Audio 2' },
        // ... more audio files
    ];

    const handleExport = () => {
        // Logic to export the selected audio file as JSON
        console.log(`Exporting ${selectedFile}`);
    };

    return (
        <View className="flex-1 justify-center items-center bg-gray-100 p-4">
            <Text className="text-xl font-bold mb-4">Export Audio with Notes</Text>
            <Picker
                selectedValue={selectedFile}
                onValueChange={(itemValue) => setSelectedFile(itemValue)}
                className="mb-4 w-full bg-white rounded-md"
            >
                <Picker.Item label="Select an audio file" value={null} />
                {audioFiles.map(file => (
                    <Picker.Item key={file.id} label={file.title} value={file.id} />
                ))}
            </Picker>
            <Button title="Export as JSON" onPress={handleExport} />
        </View>
    );
};

export default Export;
