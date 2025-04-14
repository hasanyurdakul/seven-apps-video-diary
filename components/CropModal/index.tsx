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
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';

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

  const player = useVideoPlayer(selectedVideo || null, player => {
    if (selectedVideo) {
      player.timeUpdateEventInterval = 0.1; // More frequent updates for smoother UI
    }
  });

  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime || 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  React.useEffect(() => {
    if (status === 'readyToPlay') {
      setVideoDuration(player.duration);
      setEndTime(Math.min(5, player.duration));
    }
  }, [status, player]);

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

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
      player.currentTime = value;
    },
    [videoDuration, player]
  );

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying, player]);

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

                {selectedVideo ? (
                  <View style={styles.videoContainer}>
                    <VideoView
                      player={player}
                      style={styles.video}
                      contentFit="contain"
                      allowsFullscreen
                    />
                    <View style={styles.videoControls}>
                      <Button title={isPlaying ? 'Pause' : 'Play'} onPress={togglePlayPause} />
                      <Text style={styles.timeText}>
                        Current: {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </Text>
                    </View>
                    <View style={styles.cropControls}>
                      <Text style={styles.cropText}>
                        Crop Range: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s{'\n'}Duration:{' '}
                        {(endTime - startTime).toFixed(1)}s
                      </Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={Math.max(0, videoDuration - 5)}
                        step={0.1}
                        value={startTime}
                        onValueChange={handleSliderChange}
                      />
                    </View>
                  </View>
                ) : (
                  <Button title="Select Video" onPress={pickVideo} />
                )}

                <View style={styles.formContainer}>
                  <Text style={styles.label}>Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter video name"
                    returnKeyType="next"
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
                  />

                  <View style={styles.buttonContainer}>
                    <Button
                      title={isLoading ? 'Cropping...' : 'Crop and Save'}
                      onPress={handleCrop}
                      disabled={isLoading || !selectedVideo}
                    />
                    <Button title="Cancel" onPress={onClose} />
                  </View>
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
  videoContainer: {
    marginBottom: 15,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  cropControls: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  cropText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  formContainer: {
    marginTop: 15,
  },
});

export default CropModal;
