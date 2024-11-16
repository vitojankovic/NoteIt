import React, { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Animated, ScrollView } from 'react-native'
import { Audio } from 'expo-av'
import { useRecordingContext, RecordingMetadata } from './RecordingContext'
import { Ionicons } from '@expo/vector-icons'
import { Gesture, GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler'

export default function Library() {
  const { recordings, deleteRecording } = useRecordingContext()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingRecording, setPlayingRecording] = useState<RecordingMetadata | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentNote, setCurrentNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const positionRef = useRef(currentPosition)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)


  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [sound])

  useEffect(() => {
    if (playingRecording && playingRecording.notes) {
      const currentNoteObj = playingRecording.notes.reduce((prev, curr) => {
        if (curr.timestamp <= positionRef.current && (!prev || curr.timestamp > prev.timestamp)) {
          return curr
        }
        return prev
      }, null)
      setCurrentNote(currentNoteObj ? currentNoteObj.note : '')
    }
  }, [currentPosition, playingRecording])


  const updatePosition = () => {
    if (sound) {
      sound.getStatusAsync().then(status => {
        if (status.isLoaded) {
          setCurrentPosition(status.positionMillis)
          positionRef.current = status.positionMillis
        }
      })
    }
  }

  const playRecording = async (recording: RecordingMetadata) => {
    try {
      if (sound) {
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.audioPath },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      )
      setSound(newSound)
      setPlayingRecording(recording)
      setIsPlaying(true)

      const status = await newSound.getStatusAsync()
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0)
      }

      await newSound.playAsync()

      // Start interval to update position frequently
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(updatePosition, 100) // Update every 100ms
    } catch (error) {
      console.error('Error playing recording:', error)
    }
  }

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying)
      if (status.didJustFinish) {
        setPlayingRecording(null)
        setCurrentPosition(0)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync()
      await sound.unloadAsync()
      setSound(null)
      setPlayingRecording(null)
      setCurrentPosition(0)
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      } else {
        await sound.playAsync()
        intervalRef.current = setInterval(updatePosition, 100)
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seekTo = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position)
      setCurrentPosition(position)
      positionRef.current = position
    }
  }

  const filteredRecordings = recordings.filter((recording) =>
    recording.name.toLowerCase().includes(searchQuery.toLowerCase())
  )


  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  const renderWaveform = (notes: { timestamp: number, importance: string }[]) => {
    const maxTimestamp = Math.max(...notes.map(note => note.timestamp)); // Get the max timestamp (duration)
  
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: 80 }}>
        {/* Static Line */}
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 5,
          bottom: 57,
          backgroundColor: '#ffffff',
          borderRadius: 60,
        }} />
  
        {/* Render Bumps */}
        {notes.map((note, index) => {
          // Calculate position based on the timestamp and the width of the container
          const position = (note.timestamp / maxTimestamp) * 300; // 300px is the width of your container
          const bumpHeight = note.importance === 'high' ? 40 : 20; // Larger bumps for higher importance notes
  
          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: position, // Position it based on the timestamp
                bottom: 50, // Position the bump above the baseline
                width: 6, // Wider bump for more pronounced effect
                height: bumpHeight, // Increased height for more dramatic effect
                backgroundColor: '#ffffff', // Color of the bump
              }}
            />
          );
        })}
      </View>
    );
  }
  
  

  
  const renderItem = ({ item }: { item: RecordingMetadata }) => {
    return (
      <GestureHandlerRootView>
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        rightThreshold={-100}
      >
        <TouchableOpacity
          onPress={() => playRecording(item)}
          className="bg-paper rounded-lg p-4 mb-4 rounded-[40px] h-[100px] flex shadow-lg shadow"
        >
          <Text className="text-lg font-bold text-txtp text-center">{item.name}</Text>
          
          {/* Render waveform using notes */}
          {renderWaveform(item.notes || [])}
        </TouchableOpacity>
      </Swipeable>
      </GestureHandlerRootView>
    )
  }


  const renderRightActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation, item: RecordingMetadata) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    })
    return (
      <TouchableOpacity
        style={{
          backgroundColor: 'red',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: 20,
          width: 1000,
        }}
        onPress={() => deleteRecording(item.audioPath)}
      >
        <Animated.Text
          style={{
            color: 'white',
            fontWeight: '600',
            transform: [{ translateX: trans }],
          }}
        >
          Delete
        </Animated.Text>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-background p-4 pt-[50px]">
      <View className="flex-row items-center bg-paper rounded-[24px] shadow-md mb-4 px-4 py-2">
        <Ionicons name="search" size={20} color="#ffffff" style={{ marginRight: 8 }} />
        <TextInput
          className="font-sans flex-1 text-txtp"
          placeholder="Search recordings..."
          placeholderTextColor={"rgba(255, 255, 255, 0.7)"}
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
      <Modal visible={!!playingRecording} animationType="slide">
        <View className="flex-1 bg-background">
        <Text className="font-sans text-2xl font-bold text-txtp mb-4 p-4 w-[100vw] bg-paper">
              {playingRecording?.name}
            </Text>
          <ScrollView className="flex-1 flex-start pl-2">
            <Text className="text-6xl mb-8 text-txts">{currentNote}</Text>
          </ScrollView>
          <View className="mb-8 mx-4">
            <View className="h-4 bg-paper rounded-full">
              <View
                className="h-full bg-txtp rounded-full"
                style={{ width: `${(currentPosition / duration) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="font-sans text-sm text-txts">
                {formatTime(currentPosition)}
              </Text>
              <Text className="font-sans text-sm text-txts">
                {formatTime(duration)}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-center items-center mb-8">
            <TouchableOpacity
              onPress={() => seekTo(Math.max(0, currentPosition - 10000))}
              className="mx-4"
            >
              <Ionicons name="play-back" size={40} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} className="mx-4">
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={60}
                color="#ffffff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => seekTo(Math.min(duration, currentPosition + 10000))}
              className="mx-4"
            >
              <Ionicons name="play-forward" size={40} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={stopPlayback}
            className="bg-red-500 rounded-full p-4 items-center mb-4 mx-4"
          >
            <Text className="font-sans text-txtp font-bold text-3xl">Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}