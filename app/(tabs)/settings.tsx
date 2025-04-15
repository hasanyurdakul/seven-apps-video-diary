import { View, Text, SafeAreaView, Button } from 'react-native';
import React from 'react';
import { useVideoDiaryStore } from '~/store/store';

const Settings = () => {
  const clearVideos = useVideoDiaryStore(state => state.clearVideos);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Settings</Text>
        <Button title="Clear Videos" onPress={clearVideos} />
      </View>
    </SafeAreaView>
  );
};

export default Settings;
