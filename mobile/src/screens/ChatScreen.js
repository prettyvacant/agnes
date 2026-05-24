import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import TypingIndicator from '../components/TypingIndicator';
import theme from '../theme';

const WELCOME = (artistName) =>
  `Hola, soy Agnes ✦\n\nSoy tu guía en el mundo del arte feminista y queer. Hoy celebramos a ${artistName ?? 'una gran artista'} — pero podés preguntarme sobre cualquier cosa: artistas, movimientos, recomendaciones, historia...\n\n¿Qué querés descubrir hoy?`;

let msgId = 0;
const mkMsg = (role, text) => ({ id: String(++msgId), role, text });

export default function ChatScreen({ route }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artistName, setArtistName] = useState(null);
  const flatRef = useRef(null);
  const initialSent = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artist`);
        const data = await res.json();
        setArtistName(data.name);
        setMessages([mkMsg('assistant', WELCOME(data.name))]);
      } catch {
        setMessages([mkMsg('assistant', WELCOME(null))]);
      }
    }
    init();
  }, []);

  // If navigated from ArtistScreen with a pre-filled message, send it once
  useEffect(() => {
    const initial = route?.params?.initialMessage;
    if (initial && messages.length > 0 && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initial);
    }
  }, [route?.params?.initialMessage, messages]);

  function scrollDown() {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }

  async function sendMessage(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading) return;
    setInput('');

    const userMsg = mkMsg('user', trimmed);
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    scrollDown();

    const history = messages
      .concat(userMsg)
      .map(({ role, text }) => ({ role, content: text }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [...prev, mkMsg('assistant', data.response)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        mkMsg('assistant', 'Hubo un error de conexión. Verificá que el backend esté corriendo e intentá de nuevo.'),
      ]);
    } finally {
      setIsLoading(false);
      scrollDown();
    }
  }

  function resetChat() {
    initialSent.current = false;
    msgId = 0;
    setMessages([mkMsg('assistant', WELCOME(artistName))]);
    setInput('');
  }

  function renderItem({ item }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrapper, isUser ? styles.wrapperUser : styles.wrapperAi]}>
        {!isUser && (
          <Text style={styles.agnesLabel}>Agnes</Text>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textAi]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habla con Agnes</Text>
        <TouchableOpacity onPress={resetChat} style={styles.resetBtn}>
          <Ionicons name="refresh" size={16} color={theme.textMuted} />
          <Text style={styles.resetText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollDown}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="¿Qué querés explorar?"
            placeholderTextColor={theme.textDim}
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bgCard,
  },
  headerTitle: {
    fontFamily: theme.fontSansMed,
    fontSize: 13,
    color: theme.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: {
    fontFamily: theme.fontSans,
    fontSize: 12,
    color: theme.textMuted,
  },

  messageList: {
    padding: 20,
    paddingBottom: 8,
    flexGrow: 1,
  },

  msgWrapper: { marginBottom: 14, maxWidth: '80%' },
  wrapperUser: { alignSelf: 'flex-end' },
  wrapperAi: { alignSelf: 'flex-start' },

  agnesLabel: {
    fontFamily: theme.fontSansMed,
    fontSize: 10,
    color: theme.primary,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius,
  },
  bubbleUser: {
    backgroundColor: theme.bgMsgUser,
    borderTopRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: theme.bgMsgAi,
    borderWidth: 1,
    borderColor: theme.border,
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  textUser: {
    fontFamily: theme.fontSans,
    color: theme.text,
  },
  textAi: {
    fontFamily: theme.fontSans,
    color: '#cfc0e0',
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.bg,
  },
  input: {
    flex: 1,
    backgroundColor: theme.bgCard,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fontSans,
    fontSize: 14,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: theme.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.textDim,
  },
});
