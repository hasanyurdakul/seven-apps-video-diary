import { View, Text, SafeAreaView } from 'react-native';
import React from 'react';

const Settings = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Settings</Text>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
