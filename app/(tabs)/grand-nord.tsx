import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GrandNordScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('@/assets/images/a.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Culture du Grand Nord</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peuples et Ethnies</Text>
            <Text style={styles.text}>
              Le Grand Nord camerounais est principalement habité par les Peuls, les Kotoko, 
              les Massa, les Mousgoum, les Toupouri et bien d'autres ethnies riches en traditions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Traditions</Text>
            <Text style={styles.text}>
              • Festival du Lamidat de Rey Bouba{"\n"}
              • Cérémonies d'initiation des jeunes garçons{"\n"}
              • Danse traditionnelle Guérewol{"\n"}
              • Artisanat du cuir et de la vannerie
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gastronomie</Text>
            <Text style={styles.text}>
              • Le mil sous toutes ses formes{"\n"}
              • Le boule de maïs{"\n"}
              • Les plats à base de viande de bœuf et de chèvre{"\n"}
              • Le lait caillé et les produits laitiers
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(211, 84, 0, 0.9)',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 240, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D35400',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});