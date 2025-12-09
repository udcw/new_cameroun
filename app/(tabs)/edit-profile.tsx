import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [tribe, setTribe] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Charger les données du profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          setEmail(user.email || '');

          // Récupérer le profil depuis la table profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Erreur chargement profil:', error);
            Alert.alert('Erreur', 'Impossible de charger votre profil');
          } else {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setTribe(profile.tribe || '');
            setPhone(profile.phone || '');
            setAvatarUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
        Alert.alert('Erreur', 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const pickImage = async () => {
    // Demander la permission d'accéder à la galerie
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    // Ouvrir la galerie avec la nouvelle API
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Demander la permission d'utiliser la caméra
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour utiliser la caméra.');
      return;
    }

    // Ouvrir la caméra
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!userId) {
      Alert.alert('Erreur', 'Utilisateur non identifié');
      return;
    }

    setUploadingAvatar(true);
    
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Utiliser XMLHttpRequest pour récupérer le blob
      const blob = await uriToBlob(uri);

      // Convertir blob en base64 via FileReader
      const base64Data = await blobToBase64(blob);
      
      // Extraire uniquement les données base64 (enlever le préfixe data:image/...;base64,)
      const base64 = base64Data.split(',')[1];
      
      // Convertir base64 en Uint8Array
      const bytes = base64ToUint8Array(base64);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour l'URL de l'avatar dans la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      Alert.alert('Succès', 'Photo de profil mise à jour !');
      
    } catch (error: any) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible de télécharger la photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fonction pour convertir URI en Blob
  const uriToBlob = (uri: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response);
      };
      xhr.onerror = function() {
        reject(new Error('Failed to convert URI to Blob'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  // Fonction pour convertir Blob en base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert Blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fonction pour convertir base64 en Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const removeAvatar = async () => {
    if (!avatarUrl) return;
    
    try {
      // Extraire le nom du fichier de l'URL
      const fileName = avatarUrl.split('/').pop();
      const filePath = `${userId}/${fileName}`;

      // Supprimer le fichier du storage
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Erreur suppression:', error);
      }

      // Mettre à jour l'état dans la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour l'état local
      setAvatarUrl(null);
      setAvatarUri(null);
      
      Alert.alert('Succès', 'Photo de profil supprimée');
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Le téléphone peut être vide
    const cleaned = phone.replace(/\D/g, '');
    return /^237\d{9}$/.test(cleaned);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le nom et prénom sont obligatoires');
      return;
    }

    if (phone && !validatePhone(phone)) {
      Alert.alert('Erreur', 'Le numéro doit commencer par 237 et contenir 12 chiffres au total.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          tribe: tribe.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Succès', 'Profil mis à jour avec succès !');
      router.back(); // Retour à l'écran précédent
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/a.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#8B0000" />
              </TouchableOpacity>
              <Text style={styles.title}>Modifier le profil</Text>
            </View>

            {/* Section photo de profil */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {(avatarUri || avatarUrl) ? (
                  <Image 
                    source={{ uri: avatarUri || avatarUrl || '' }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color="#8B0000" />
                  </View>
                )}
                
                {uploadingAvatar && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                  </View>
                )}
              </View>

              <View style={styles.avatarButtons}>
                <TouchableOpacity 
                  style={styles.avatarButton}
                  onPress={pickImage}
                  disabled={uploadingAvatar}
                >
                  <Ionicons name="image-outline" size={20} color="#FFF" />
                  <Text style={styles.avatarButtonText}>Galerie</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.avatarButton}
                  onPress={takePhoto}
                  disabled={uploadingAvatar}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFF" />
                  <Text style={styles.avatarButtonText}>Caméra</Text>
                </TouchableOpacity>
                
                {(avatarUri || avatarUrl) && (
                  <TouchableOpacity 
                    style={[styles.avatarButton, styles.removeButton]}
                    onPress={removeAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFF" />
                    <Text style={styles.avatarButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prénom *</Text>
              <TextInput
                placeholder="Votre prénom"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom *</Text>
              <TextInput
                placeholder="Votre nom"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ethnie / Tribu</Text>
              <TextInput
                placeholder="Votre ethnie ou tribu"
                value={tribe}
                onChangeText={setTribe}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                placeholder="2376XXXXXXXX"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <Text style={styles.phoneHint}>
                Format: 237 suivi de 9 chiffres (ex: 237612345678)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Votre email"
                value={email}
                style={[styles.input, styles.disabledInput]}
                editable={false}
              />
              <Text style={styles.hintText}>
                L'email ne peut pas être modifié
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && { backgroundColor: '#aaa' }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingVertical: 20 },
  container: {
    backgroundColor: 'rgba(255, 255, 240, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8B0000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B0000',
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFDAB9',
    borderWidth: 4,
    borderColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE4B5',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  removeButton: {
    backgroundColor: '#FF4500',
  },
  avatarButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B0000',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#8B0000',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#FFF8DC',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  phoneHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B0000',
  },
  cancelButtonText: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 16,
  },
});