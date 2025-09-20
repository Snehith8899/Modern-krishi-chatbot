import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/ask`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = { text: inputText, sender: 'user' };
    setMessages(currentMessages => [userMessage, ...currentMessages]);
    setInputText('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botMessage = { text: data.reply, sender: 'bot' };
      setMessages(currentMessages => [botMessage, ...currentMessages]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'Sorry, I am unable to connect. Please try again later.', sender: 'bot' };
      setMessages(currentMessages => [errorMessage, ...currentMessages]);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.message, item.sender === 'user' ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.headerTitle}>Digital Krishi Officer 🧑‍🌾</Text>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          inverted
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Button title="Send" onPress={handleSend} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    color: '#000',
  },
  message: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '75%',
  },
  userMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#ececec',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 10,
  },
});

const App = () => (
  <SafeAreaProvider>
    <Chatbot />
  </SafeAreaProvider>
);

export default App;
