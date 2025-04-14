// app/index.tsx
import React from 'react';
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
} from 'react-native';
import { Link } from 'expo-router';
import { useVideoDiaryStore } from '../../store/store';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ResizeMode } from 'expo-av';
import { useNavigation } from 'expo-router';
import { useEvent } from 'expo';

const MainScreen = () => {
  const videos = useVideoDiaryStore(state => state.videos);
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: { id: string; name: string; videoUri: string } }) => {
    const player = useVideoPlayer(item.videoUri, player => {
      player.loop = true;
      player.staysActiveInBackground = true;
      player.volume = 0; // Mute by default in list view
      // Generate thumbnail when video is ready
      if (player.status === 'readyToPlay') {
        player.generateThumbnailsAsync([0]).then(thumbnails => {
          // You can use thumbnails[0] with expo-image if needed
          console.log('Thumbnail generated:', thumbnails[0]);
        });
      }
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { status } = useEvent(player, 'statusChange', { status: player.status });

    return (
      <TouchableOpacity
        onPress={() => navigation.push('details', { id: item.id })}
        style={styles.videoItem}
      >
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
          <Text style={styles.videoTitle}>{item.name}</Text>
          <Text style={styles.videoStatus}>{status === 'loading' ? 'Loading...' : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Video Diary</Text>
          <FlatList
            data={videos}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => <Text style={styles.emptyText}>No videos yet. Add one!</Text>}
            contentContainerStyle={styles.list}
          />
          <Link href="/details" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add New Video</Text>
            </TouchableOpacity>
          </Link>
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
    padding: 16,
  },
  videoItem: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  videoStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainScreen;
