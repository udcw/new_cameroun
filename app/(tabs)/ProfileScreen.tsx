import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Erreur récupération profil:', error);
      } else {
        setUserData(profile);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    } else {
      router.replace('/login');
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#8B0000']}
          tintColor="#8B0000"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#FFF" />
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* Photo de profil */}
      <View style={styles.avatarContainer}>
        {userData?.avatar_url ? (
          <Image 
            source={{ uri: userData.avatar_url }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={50} color="#8B0000" />
          </View>
        )}
        {userData?.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      {userData ? (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#8B0000" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Nom complet</Text>
              <Text style={styles.value}>
                {userData.first_name} {userData.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#8B0000" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{userData.email}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#8B0000" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Téléphone</Text>
              <Text style={styles.value}>{userData.phone || 'Non renseigné'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#8B0000" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Ethnie / Tribu</Text>
              <Text style={styles.value}>{userData.tribe || 'Non renseigné'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Ionicons name="trophy-outline" size={20} color="#8B0000" />
            <View style={styles.infoContent}>
              <Text style={styles.label}>Statut</Text>
              <Text style={[styles.value, userData.is_premium ? styles.premiumValue : styles.freeValue]}>
                {userData.is_premium ? 'Premium' : 'Gratuit'}
              </Text>
            </View>
          </View>

          {userData.is_premium && userData.premium_activated_at && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#8B0000" />
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Premium depuis</Text>
                  <Text style={styles.value}>
                    {new Date(userData.premium_activated_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            </>
          )}

          {userData.created_at && (
            <>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#8B0000" />
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Membre depuis</Text>
                  <Text style={styles.value}>
                    {new Date(userData.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des informations...</Text>
        </View>
      )}

      {/* Bouton déconnexion */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FFF" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF8DC',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#8B0000',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginBottom: 20,
    position: 'relative'
  },
  avatar: { 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    backgroundColor: '#FFDAB9',
    borderWidth: 4,
    borderColor: '#8B0000'
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFE4B5',
    borderWidth: 4,
    borderColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  premiumText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4
  },
  infoContainer: { 
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 240, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  label: { 
    fontWeight: '600', 
    color: '#8B0000',
    fontSize: 14,
    marginBottom: 2,
  },
  value: { 
    fontWeight: '400', 
    color: '#030303',
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 5,
  },
  premiumValue: {
    color: '#27AE60',
    fontWeight: '700'
  },
  freeValue: {
    color: '#666',
    fontWeight: '500'
  },
  logoutButton: { 
    backgroundColor: '#FF4500', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16,
    marginLeft: 10
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B0000',
  },
});