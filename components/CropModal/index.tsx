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
  TouchableOpacity,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const { mutate, isLoading, isError, data, error } = useVideoCropping();
  const addVideo = useVideoDiaryStore(state => state.addVideo);

  const player = useVideoPlayer(selectedVideo || null, player => {
    if (selectedVideo) {
      player.timeUpdateEventInterval = 0.1; // More frequent updates for smoother UI
      player.loop = false; // Disable loop, we'll handle it manually
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

  // Add effect to handle segment bounds
  React.useEffect(() => {
    if (currentTime >= endTime) {
      player.pause();
      player.currentTime = startTime;
    }
  }, [currentTime, endTime, startTime, player]);

  const handleCrop = async () => {
    if (!selectedVideo) {
      alert('Please select a video first.');
      return;
    }

    if (!name || !description) {
      alert('Please enter name and description.');
      return;
    }

    const duration = endTime - startTime;

    // Additional validation for duration
    if (duration <= 0) {
      alert('Invalid time range selected. Please try again.');
      return;
    }

    if (startTime >= endTime) {
      alert('Start time must be before end time.');
      return;
    }

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
      // Ensure startTime cannot exceed videoDuration - 5
      const maxStartTime = Math.max(0, videoDuration - 5);
      const newStartTime = Math.min(value, maxStartTime);
      const newEndTime = newStartTime + 5;

      setStartTime(newStartTime);
      setEndTime(newEndTime);

      // Just update currentTime while dragging, don't play
      player.currentTime = newStartTime;
    },
    [videoDuration, player]
  );

  const handleSliderComplete = useCallback(() => {
    // Only play when user finishes dragging
    player.currentTime = startTime;
    player.play();
  }, [player, startTime]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.currentTime = startTime;
      player.play();
    }
  }, [isPlaying, player, startTime]);

  const moveToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const moveToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 1: Select Video</Text>
            {selectedVideo ? (
              <>
                <VideoView
                  player={player}
                  style={styles.video}
                  contentFit="contain"
                  allowsFullscreen
                />
                <Button title="Choose Different Video" onPress={pickVideo} />
                <Button title="Next" onPress={moveToNextStep} />
              </>
            ) : (
              <Button title="Select Video" onPress={pickVideo} />
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 2: Crop Video (5s segment)</Text>
            <VideoView player={player} style={styles.video} contentFit="contain" allowsFullscreen />
            <View style={styles.videoControls}>
              <CustomButton
                title={isPlaying ? 'Pause' : 'Play'}
                onPress={togglePlayPause}
                type="primary"
              />
              <Text style={styles.timeText}>
                Current: {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
              </Text>
            </View>
            <View style={styles.cropControls}>
              <Text style={styles.cropText}>
                Selected Range: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s{'\n'}Duration: 5s
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(0, videoDuration - 5)}
                step={0.1}
                value={startTime}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor="#007AFF"
              />
            </View>
            <View style={styles.navigationButtons}>
              <CustomButton title="Back" onPress={moveToPreviousStep} type="secondary" />
              <CustomButton title="Next" onPress={moveToNextStep} type="primary" />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Step 3: Add Details</Text>
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

              <View style={styles.navigationButtons}>
                <CustomButton title="Back" onPress={moveToPreviousStep} type="secondary" />
                <CustomButton
                  title={isLoading ? 'Cropping...' : 'Crop and Save'}
                  onPress={handleCrop}
                  disabled={isLoading || !name || !description}
                  type="primary"
                />
              </View>
            </View>
          </View>
        );
    }
  };

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
                <View style={styles.header}>
                  <Text style={styles.title}>Crop Video</Text>
                  <Button title="Close" onPress={onClose} />
                </View>
                <View style={styles.stepsIndicator}>
                  {[1, 2, 3].map(step => (
                    <View
                      key={step}
                      style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}
                    />
                  ))}
                </View>
                {renderStepContent()}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  video: {
    width: '100%',
    height: 250,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    height: 120,
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
    marginTop: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  timeText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  cropControls: {
    marginTop: 20,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  cropText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  formContainer: {
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.2 }],
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#007AFF',
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  disabled = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: type === 'primary' ? '#007AFF' : 'transparent',
        borderWidth: type === 'secondary' ? 1.5 : 0,
        borderColor: '#007AFF',
        opacity: disabled ? 0.5 : 1,
      },
    ]}
  >
    <Text
      style={{
        color: type === 'primary' ? 'white' : '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default CropModal;
