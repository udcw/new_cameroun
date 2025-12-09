import { createDrawerNavigator, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import ProfileScreen from './explore';
import HomeScreen from './home';
import SettingsScreen from './ProfileScreen';

const Drawer = createDrawerNavigator();

export default function AppDrawer({ navigation }: any) {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setUserName(profile.first_name);
        }
      }
    };
    fetchUserName();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Erreur', error.message);
      } else {
        navigation.replace('login');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#FF8C00',
        drawerLabelStyle: { fontSize: 16 },
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
          {/* Menu principal */}
          <View style={{ flex: 1 }}>
            <DrawerItemList {...props} />
          </View>

          {/* Bouton déconnexion en bas */}
          <View style={{ paddingBottom: 20 }}>
            <DrawerItem
              label="Se déconnecter"
              onPress={handleLogout}
              labelStyle={{ color: '#FF4500', fontWeight: '700' }}
            />
          </View>
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerStyle: { backgroundColor: '#FF8C00' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '700' },
          headerTitleAlign: 'left',
          headerRight: () => (
            <Text
              style={{
                color: '#FFF',
                fontWeight: '700',
                marginRight: 15,
                fontSize: 16,
              }}
            >
              {userName ? userName : ''}
            </Text>
          ),
        }}
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}