import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import theme from '../theme';

export default function ArtistScreen({ navigation }) {
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchArtist(); }, []);

  async function fetchArtist() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/artist`);
      if (!res.ok) throw new Error('Respuesta inválida del servidor');
      const data = await res.json();
      setArtist(data);
    } catch {
      setError('No se pudo conectar con el servidor.\nVerificá que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  function handleAskAbout() {
    navigation.navigate('Chat', {
      initialMessage: `Cuéntame más sobre ${artist.name} y su importancia en el arte feminista y queer`,
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.logo}><Text style={styles.logoSymbol}>✦ </Text>agnes</Text>
        <ActivityIndicator color={theme.primary} size="large" style={{ marginTop: 32 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.logo}><Text style={styles.logoSymbol}>✦ </Text>agnes</Text>
        <Ionicons name="wifi-outline" size={40} color={theme.textMuted} style={{ marginTop: 32 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchArtist} style={styles.retryBtn}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={styles.logoSymbol}>✦ </Text>agnes
          </Text>
        </View>

        {/* Artist card */}
        <LinearGradient
          colors={['#1e0f30', '#150e1f']}
          style={styles.card}
        >
          <Text style={styles.dayLabel}>artista del día</Text>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistMeta}>{artist.years} · {artist.nacionalidad}</Text>

          {/* Movement tags */}
          <View style={styles.tagsRow}>
            {artist.movimientos.map((m, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.description}>{artist.descripcion}</Text>

          {/* Works */}
          <Text style={styles.worksLabel}>obras destacadas</Text>
          {artist.obras_destacadas.map((obra, i) => (
            <View key={i} style={styles.workRow}>
              <Text style={styles.workDot}>·</Text>
              <Text style={styles.workText}>{obra}</Text>
            </View>
          ))}

          {/* Theme tags */}
          <View style={[styles.tagsRow, { marginTop: 18 }]}>
            {artist.temas.map((t, i) => (
              <View key={i} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleAskAbout} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Pregunta sobre {artist.name}</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>

        <Text style={styles.footer}>arte feminista · queer · interseccional</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  centered: {
    flex: 1, backgroundColor: theme.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  scroll: { padding: 24, paddingBottom: 40 },

  header: { marginBottom: 24 },
  logo: {
    fontFamily: theme.fontSerif,
    fontSize: 30,
    color: theme.text,
    letterSpacing: 1,
  },
  logoSymbol: { color: theme.primary },

  card: {
    borderRadius: theme.radius,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  dayLabel: {
    fontFamily: theme.fontSansMed,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: theme.primary,
    marginBottom: 10,
  },
  artistName: {
    fontFamily: theme.fontSerif,
    fontSize: 28,
    color: theme.text,
    lineHeight: 34,
    marginBottom: 6,
  },
  artistMeta: {
    fontFamily: theme.fontSans,
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 14,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: {
    backgroundColor: '#2a1240',
    borderWidth: 1,
    borderColor: '#4a1f6a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tagText: {
    fontFamily: theme.fontSansMed,
    fontSize: 11,
    color: theme.primaryLight,
  },
  description: {
    fontFamily: theme.fontSans,
    fontSize: 13.5,
    lineHeight: 22,
    color: '#b8a8cc',
    marginBottom: 18,
  },
  worksLabel: {
    fontFamily: theme.fontSansMed,
    fontSize: 9.5,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: theme.accent,
    marginBottom: 8,
  },
  workRow: { flexDirection: 'row', marginBottom: 5, paddingRight: 8 },
  workDot: {
    fontFamily: theme.fontSans,
    fontSize: 14,
    color: theme.accent,
    marginRight: 8,
    marginTop: 1,
  },
  workText: {
    fontFamily: theme.fontSans,
    fontSize: 13,
    color: '#9f8cb5',
    flex: 1,
    lineHeight: 19,
  },
  themeTag: {
    borderWidth: 1,
    borderColor: theme.textDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  themeTagText: {
    fontFamily: theme.fontSans,
    fontSize: 10,
    color: theme.textDim,
    letterSpacing: 0.5,
  },

  ctaBtn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radius,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ctaText: {
    fontFamily: theme.fontSansMed,
    fontSize: 14,
    color: 'white',
  },
  footer: {
    fontFamily: theme.fontSans,
    fontSize: 10,
    color: theme.textDim,
    textAlign: 'center',
    letterSpacing: 1.5,
  },

  errorText: {
    fontFamily: theme.fontSans,
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.radius,
  },
  retryText: {
    fontFamily: theme.fontSansMed,
    fontSize: 14,
    color: theme.primary,
  },
});
