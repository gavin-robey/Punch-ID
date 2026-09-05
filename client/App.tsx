import './global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Platform, StyleSheet, useColorScheme} from "react-native";
import { GluestackUIProvider} from './components/ui/gluestack-ui-provider';
import { useState } from 'react';
import Navigator  from './src/navigator/index';
import { Provider } from 'react-redux';
import store from './src/store';

export default function App() {
  const systemScheme = useColorScheme();
  const [mode] = useState<'light' | 'dark'>(systemScheme === 'dark' ? 'dark' : 'light');

  return (
    <Provider store={store}>
      <GluestackUIProvider mode='dark'>
        <SafeAreaProvider>
          <SafeAreaView edges={['top']} style={[styles.container]}>
            <Navigator />
          </SafeAreaView>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </Provider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 10 : 0
  }
})
