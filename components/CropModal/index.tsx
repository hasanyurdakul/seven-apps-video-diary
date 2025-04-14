// components/CropModal/index.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidView}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
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
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0}
                      maximumValue={Math.max(0, videoDuration - 5)}
                      step={0.1}
                      value={startTime}
                      onValueChange={handleSliderChange}
                    />
                  </View>
                )}

                <Text style={styles.label}>Name:</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  placeholder="Enter video name"
                />

                <Text style={styles.label}>Description:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter video description"
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />

                <View style={styles.buttonContainer}>
                  <Button
                    title={isLoading ? 'Cropping...' : 'Crop and Save'}
                    onPress={handleCrop}
                    disabled={isLoading}
                  />
                  {isError && (
                    <Text style={styles.error}>Error: {error?.message || 'Unknown error'}</Text>
                  )}
                  <Button title="Cancel" onPress={onClose} />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 15,
    gap: 10,
  },
});

export default CropModal;
