// components/CropModal/index.tsx
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Button, StyleSheet, Modal, TextInput } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import { generateId } from '../../utils/idGenerator';
import useVideoCropping from '../../hooks/useVideoCropping';
import { useVideoDiaryStore } from '../../store/store';
import * as FileSystem from 'expo-file-system';

interface CropModalProps {
  isVisible: boolean;
  onClose: () => void;
  onVideoCropped: (videoUri: string, name: string, description: string) => void;
}

const CropModal: React.FC<CropModalProps> = ({ isVisible, onClose, onVideoCropped }) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const videoRef = useRef<Video>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const { mutate, isLoading, isError, data, error } = useVideoCropping();
  const addVideo = useVideoDiaryStore(state => state.addVideo);

  const handleVideoLoaded = (playbackStatus: any) => {
    setVideoDuration(playbackStatus.durationMillis / 1000);
  };

  const handleCrop = async () => {
    if (!selectedVideo) {
      alert('Please select a video first.');
      return;
    }

    if (!name || !description) {
      alert('Please enter name and description.');
      return;
    }

    if (startTime >= endTime) {
      alert('Start time must be before end time.');
      return;
    }

    const duration = endTime - startTime;

    if (duration > 5) {
      alert('Cropped video duration cannot be more than 5 seconds');
      return;
    }

    try {
      const outputUri = `${FileSystem.cacheDirectory}cropped_video_${generateId()}.mp4`;

      mutate(
        {
          inputUri: selectedVideo,
          startTime: startTime,
          duration: duration,
          outputUri: outputUri,
        },
        {
          onSuccess: croppedVideoUri => {
            console.log('Cropped video URI:', croppedVideoUri);
            onVideoCropped(croppedVideoUri, name, description);
            onClose();
          },
          onError: (err: any) => {
            console.error('FFMPEG error:', err);
            alert(`Cropping failed: ${err.message || 'Unknown error'}`);
          },
        }
      );
    } catch (err: any) {
      console.error('Error during cropping:', err);
      alert(`Cropping failed: ${err.message || 'Unknown error'}`);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        setSelectedVideo(videoUri);
      } else {
        console.log('Video picking cancelled or no file selected');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  const handleSliderChange = useCallback(
    (value: number) => {
      setStartTime(value);
      setEndTime(Math.min(value + 5, videoDuration));
    },
    [videoDuration]
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Crop Video</Text>

          {selectedVideo && (
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onLoad={handleVideoLoaded}
            />
          )}

          <Button title="Select Video" onPress={pickVideo} />

          {selectedVideo && (
            <View>
              <Text>
                Start Time: {startTime.toFixed(2)}s, End Time: {endTime.toFixed(2)}s
              </Text>
              <Slider
                style={{ width: 200, height: 40 }}
                minimumValue={0}
                maximumValue={Math.max(0, videoDuration - 5)}
                step={0.1}
                value={startTime}
                onValueChange={handleSliderChange}
              />
            </View>
          )}

          <Text style={styles.label}>Name:</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Button
            title={isLoading ? 'Cropping...' : 'Crop and Save'}
            onPress={handleCrop}
            disabled={isLoading}
          />
          {isError && <Text style={styles.error}>Error: {error?.message || 'Unknown error'}</Text>}

          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});

export default CropModal;
