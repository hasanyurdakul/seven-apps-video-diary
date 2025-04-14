import { useMutation } from '@tanstack/react-query';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { useState } from 'react';

interface CropVariables {
  inputUri: string;
  startTime: number;
  duration: number;
  outputUri: string;
}

interface CropResult {
  outputUri: string | undefined;
  isLoading: boolean;
}

const useVideoCropping = () => {
  const [isLoading, setIsLoading] = useState(false);

  const cropVideoMutation = useMutation<string, Error, CropVariables>({
    mutationFn: async ({ inputUri, startTime, duration, outputUri }) => {
      setIsLoading(true);
      const ffmpegCommand = `-ss ${startTime} -i ${inputUri} -t ${duration} -c copy ${outputUri}`;
      const session = await FFmpegKit.execute(ffmpegCommand);
      const returnCode = await session.getReturnCode();
      setIsLoading(false);
      if (returnCode?.isValueSuccess()) {
        return outputUri;
      } else {
        throw new Error(`FFMPEG failed with code: ${returnCode?.getValue()}`);
      }
    },
  });

  return {
    ...cropVideoMutation,
    isLoading,
  };
};

export default useVideoCropping;
