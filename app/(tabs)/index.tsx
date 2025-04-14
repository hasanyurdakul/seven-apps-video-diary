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
} from 'react-native';
import { Link } from 'expo-router';
import { useVideoDiaryStore } from '../../store/store';
import { ResizeMode, Video } from 'expo-av';
import { useNavigation } from 'expo-router';

const MainScreen = () => {
  const videos = useVideoDiaryStore(state => state.videos);
  const navigation = useNavigation<any>();
  const renderItem = ({ item }: { item: { id: string; name: string; videoUri: string } }) => (
    <TouchableOpacity onPress={() => navigation.push('details', { id: item.id })}>
      <View className="p-4 border-b border-gray-200">
        <Video
          source={{ uri: item.videoUri }}
          style={{ width: 200, height: 150 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
        <Text className="text-lg font-semibold">{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1">
          <Text className="text-2xl font-bold p-4">My Video Diary</Text>
          <FlatList
            data={videos}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => (
              <Text className="p-4 text-gray-500">No videos yet. Add one!</Text>
            )}
          />
          <Link href="/details" asChild>
            <TouchableOpacity className="bg-blue-500 text-white p-4 rounded-md m-4">
              <Text className="text-center text-white">Add New Video</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MainScreen;
