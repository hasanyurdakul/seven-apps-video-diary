// app/index.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Button,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { useVideoDiaryStore } from '../../store/store';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ResizeMode } from 'expo-av';
import { useNavigation } from 'expo-router';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import CropModal from '../../components/CropModal';

const COLUMN_COUNT = 2;
const SPACING = 8;
const windowWidth = Dimensions.get('window').width;
const itemWidth = (windowWidth - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

// VideoItem component
const VideoItem = React.memo(
  ({
    item,
    onPress,
  }: {
    item: { id: string; name: string; videoUri: string };
    onPress: () => void;
  }) => {
    const player = useVideoPlayer(item.videoUri, player => {
      player.loop = true;
      player.staysActiveInBackground = true;
      player.volume = 0;
      if (player.status === 'readyToPlay') {
        player.generateThumbnailsAsync([0]).then(thumbnails => {
          console.log('Thumbnail generated:', thumbnails[0]);
        });
      }
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { status } = useEvent(player, 'statusChange', { status: player.status });

    return (
      <TouchableOpacity onPress={onPress} style={styles.videoItem}>
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            allowsFullscreen
            allowsPictureInPicture
          />
          <View style={styles.videoOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={e => {
                e.stopPropagation();
                if (isPlaying) {
                  player.pause();
                } else {
                  player.play();
                }
              }}
            >
              <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          {status === 'loading' && <Text style={styles.videoStatus}>Loading...</Text>}
        </View>
      </TouchableOpacity>
    );
  }
);

const MainScreen = () => {
  const videos = useVideoDiaryStore(state => state.videos);
  const navigation = useNavigation<any>();
  const [isCropModalVisible, setCropModalVisible] = useState(false);
  const addVideo = useVideoDiaryStore(state => state.addVideo);

  // Sort videos by most recent first (assuming id is timestamp-based)
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => Number(b.id) - Number(a.id));
  }, [videos]);

  const handleOpenCropModal = () => {
    setCropModalVisible(true);
  };

  const handleCloseCropModal = () => {
    setCropModalVisible(false);
  };

  const handleVideoCropped = (videoUri: string, name: string, description: string) => {
    const newVideo = {
      id: Date.now().toString(),
      videoUri,
      name,
      description,
    };
    addVideo(newVideo);
    handleCloseCropModal();
  };

  const renderItem = ({ item }: { item: { id: string; name: string; videoUri: string } }) => (
    <VideoItem item={item} onPress={() => navigation.push('details', { id: item.id })} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Video Diary</Text>
          <FlatList
            data={sortedVideos}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={() => <Text style={styles.emptyText}>No videos yet. Add one!</Text>}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity style={styles.fab} onPress={handleOpenCropModal}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>

          <CropModal
            isVisible={isCropModalVisible}
            onClose={handleCloseCropModal}
            onVideoCropped={handleVideoCropped}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  list: {
    padding: SPACING,
  },
  row: {
    justifyContent: 'flex-start',
    gap: SPACING,
  },
  videoItem: {
    width: itemWidth,
    marginBottom: SPACING,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  videoContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
  },
  videoInfo: {
    padding: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  videoStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MainScreen;
