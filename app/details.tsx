// app/details.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useVideoDiaryStore } from '../store/store';
import { ResizeMode, Video } from 'expo-av';
import CropModal from '../components/CropModal';
import * as DocumentPicker from 'expo-document-picker';
import { generateId } from '../utils/idGenerator';

const DetailsPage = () => {
  const { id } = useLocalSearchParams();
  const video = useVideoDiaryStore(state => state.videos.find(v => v.id === id));
  const [name, setName] = React.useState(video ? video.name : '');
  const [description, setDescription] = React.useState(video ? video.description : '');
  const updateVideo = useVideoDiaryStore(state => state.updateVideo);
  const addVideo = useVideoDiaryStore(state => state.addVideo);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isCropModalVisible, setCropModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleSave = () => {
    if (video) {
      updateVideo(id as string, { name, description });
      navigation.goBack();
    } else {
      alert('Select a video to save.');
    }
  };

  const handleOpenCropModal = () => {
    setCropModalVisible(true);
  };

  const handleCloseCropModal = () => {
    setCropModalVisible(false);
  };

  const handleVideoCropped = (videoUri: string, name: string, description: string) => {
    // Create a new video object
    const newVideo = {
      id: generateId(),
      videoUri: videoUri,
      name: name,
      description: description,
    };

    // Dispatch the addVideo action with the new video object
    addVideo(newVideo);
    navigation.goBack();
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

  return (
    <View style={styles.container}>
      {video ? (
        <>
          <Video
            source={{ uri: video.videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
          <Text style={styles.label}>Name:</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button title="Save" onPress={handleSave} />
        </>
      ) : (
        <>
          {selectedVideo && (
            <Video
              source={{ uri: selectedVideo }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          )}
          <Button title="Select Video" onPress={pickVideo} />
          <Text style={styles.label}>Name:</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button title="Open Cropper" onPress={handleOpenCropModal} />
          <Button title="Save" onPress={handleSave} disabled={!selectedVideo} />

          <CropModal
            isVisible={isCropModalVisible}
            onClose={handleCloseCropModal}
            onVideoCropped={handleVideoCropped}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  video: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
});

export default DetailsPage;
