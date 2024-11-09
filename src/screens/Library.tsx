'use client'

import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native'
import { Audio } from 'expo-av'
import { useRecordingContext, RecordingMetadata } from './RecordingContext'
import { Ionicons } from '@expo/vector-icons'

export default function Library() {
  const { recordings, deleteRecording } = useRecordingContext()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingPath, setPlayingPath] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync()
        }
      : undefined
  }, [sound])

  const playRecording = async (audioPath: string) => {
    try {
      if (sound) {
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: true }
      )
      setSound(newSound)
      setPlayingPath(audioPath)

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status && 'didJustFinish' in status && status.didJustFinish) {
          setPlayingPath(null)
        }
      })

      await newSound.playAsync()
    } catch (error) {
      console.error('Error playing recording:', error)
    }
  }

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync()
      await sound.unloadAsync()
      setSound(null)
      setPlayingPath(null)
    }
  }

  const filteredRecordings = recordings.filter((recording) => {
    if (typeof recording.name === 'string') {
      return recording.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    console.warn(`Recording name is not a string: ${JSON.stringify(recording)}`)
    return false
  })

  const renderItem = ({ item }: { item: RecordingMetadata }) => (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <Text className="font-sans text-lg font-bold text-[#8BB552] mb-2">
        {typeof item.name === 'string' ? item.name : 'Unnamed Recording'}
      </Text>
      <View className="flex-row justify-start items-center mb-3">
        <TouchableOpacity
          onPress={() => playingPath === item.audioPath ? stopPlayback() : playRecording(item.audioPath)}
          className="bg-[#8BB552] rounded-full p-2 mr-2"
        >
          <Ionicons 
            name={playingPath === item.audioPath ? "stop" : "play"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteRecording(item.audioPath)}
          className="bg-red-500 rounded-full p-2"
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Text className="font-sans font-bold text-[#A8D867] mb-1">Notes:</Text>
      {item.notes && Array.isArray(item.notes) ? (
        item.notes.map((note, index) => (
          <View key={note.timestamp || index} className="ml-2 mb-1">
            <Text className="font-sans text-xs text-gray-500">{note.timestamp || 'No timestamp'}</Text>
            <Text className="font-sans text-sm">{note.note || 'No note'}</Text>
          </View>
        ))
      ) : (
        <Text className="font-sans text-sm text-gray-500">No notes available</Text>
      )}
    </View>
  )

  return (
    <View className="flex-1 bg-[#FAFBF8] p-4">
      <View className="flex-row items-center bg-white rounded-full shadow-sm mb-4 px-4 py-2">
        <Ionicons name="search" size={20} color="#8BB552" style={{ marginRight: 8 }} />
        <TextInput
          className="font-sans flex-1 text-[#8BB552]"
          placeholder="Search recordings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {filteredRecordings.length === 0 ? (
        <Text className="font-sans text-center text-gray-500">No recordings found</Text>
      ) : (
        <FlatList
          data={filteredRecordings}
          keyExtractor={(item) => item.audioPath}
          renderItem={renderItem}
        />
      )}
    </View>
  )
}