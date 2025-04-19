
## Installing Directions

- Since **ffmpeg-kit-react-native** binaries are **removed from npm**, we have to compile the library from [source code](https://github.com/arthenica/ffmpeg-kit).
- For easy demonstration, I've already included the source code itself in the project. 
- But if you like to know how i did it in depth, please follow this [issue](https://github.com/arthenica/ffmpeg-kit/issues/1144) 
- Also check out this [article](https://dev.to/utkarsh4517/using-ffmpegkit-locally-in-react-native-after-retirement-3a9p) 

#### Steps
1. First of all. Lets start building project. This will throw an error but don't worry. We'll fix it in next steps.
```bash
npm install 

then 

npx expo run:ios
```
2. Open up your ios directory
```bash
cd ios
```
3. Locate this lines in **Podfile**
```bash
target 'sevenappsvideodiary' do
  use_expo_modules!
  ```
4. Add following line under it. Now it should look like this. This will link included binaries.
```bash
target 'sevenappsvideodiary' do
  use_expo_modules!
  pod 'seven-apps-video-diary-ffmpeg-kit-ios-https', :path => '..'
  ```
  5. Run this command again. And you are done!
```bash
npx expo run:ios
```
