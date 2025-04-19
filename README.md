
## Installing Directions

- Since **ffmpeg-kit-react-native** binaries are **removed from npm**, we have to compile the library from source code.
- For easy demonstration, I've already included the source code itself in the project. 
#### Steps
1. First of all. Lets start building project. This will throw an error but don't worry. We'll fix it in next steps.
```bash
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
