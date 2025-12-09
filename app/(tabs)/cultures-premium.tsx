import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const culturesData = [
  {
    id: '1',
    name: 'Grand Nord',
    description: 'Culture et traditions des peuples du Nord',
    color: '#D35400',
    route: '/grand-nord',
    icon: 'sunny',
  },
  {
    id: '2',
    name: 'Grand Sud',
    description: 'Héritage culturel des régions du Sud',
    color: '#27AE60',
    route: '/grand-sud',
    icon: 'leaf',
  },
  {
    id: '3',
    name: 'Grass Field',
    description: 'Royaumes et chefferies de l\'Ouest',
    color: '#2980B9',
    route: '/grass-field',
    icon: 'business',
  },
  {
    id: '4',
    name: 'Sawa',
    description: 'Culture côtière et traditions maritimes',
    color: '#8E44AD',
    route: '/sawa',
    icon: 'water',
  },
];

export default function CulturesPremiumScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('@/assets/images/a.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Cultures Premium</Text>
            <Text style={styles.subtitle}>Accès complet débloqué</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={20} color="#FFD700" />
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue dans l'espace Premium!</Text>
          <Text style={styles.welcomeText}>
            Vous avez maintenant accès à toutes les cultures du Cameroun avec des contenus exclusifs et détaillés.
          </Text>
        </View>

        {/* Cultures Grid */}
        <View style={styles.culturesSection}>
          <Text style={styles.sectionTitle}>Grandes Cultures du Cameroun</Text>
          <View style={styles.culturesGrid}>
            {culturesData.map((culture) => (
              <TouchableOpacity
                key={culture.id}
                style={[styles.cultureCard, { backgroundColor: culture.color }]}
                onPress={() => router.push(culture.route as any)}
              >
                <View style={styles.cultureIcon}>
                  <Ionicons name={culture.icon as any} size={32} color="#FFF" />
                </View>
                <Text style={styles.cultureName}>{culture.name}</Text>
                <Text style={styles.cultureDescription}>{culture.description}</Text>
                <View style={styles.cultureArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Premium Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Contenus Exclusifs</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="images" size={30} color="#8B0000" />
              <Text style={styles.featureCardTitle}>Galerie Photo</Text>
              <Text style={styles.featureCardText}>+100 photos exclusives</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="videocam" size={30} color="#8B0000" />
              <Text style={styles.featureCardTitle}>Vidéos</Text>
              <Text style={styles.featureCardText}>Cérémonies traditionnelles</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="musical-notes" size={30} color="#8B0000" />
              <Text style={styles.featureCardTitle}>Musiques</Text>
              <Text style={styles.featureCardText}>Rythmes authentiques</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="document-text" size={30} color="#8B0000" />
              <Text style={styles.featureCardTitle}>Documents</Text>
              <Text style={styles.featureCardText}>Textes historiques</Text>
            </View>
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
    backgroundColor: 'rgba(139, 0, 0, 0.95)',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
  welcomeSection: {
    backgroundColor: 'rgba(255, 255, 240, 0.95)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#27AE60',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  culturesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  culturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  cultureCard: {
    width: (width - 70) / 2,
    borderRadius: 15,
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  cultureIcon: {
    marginBottom: 10,
  },
  cultureName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cultureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  cultureArrow: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  featuresSection: {
    padding: 20,
    paddingTop: 0,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  featureCard: {
    width: (width - 70) / 2,
    backgroundColor: 'rgba(255, 255, 240, 0.95)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B0000',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureCardText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
});