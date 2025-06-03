// app/index.tsx
import { Linking, View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'http://192.168.1.2:3000' }}
        style={styles.webview}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        onShouldStartLoadWithRequest={(request) => {
            if (
              request.url.startsWith('https://accounts.google.com') ||
              request.url.startsWith('https://github.com') ||
              request.url.includes('oauth') ||
              request.url.includes('clerk') // optional, add more if needed
            ) {
              // Open in external browser
              Linking.openURL(request.url);
              return false;
            }
            return true;
          }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
});
