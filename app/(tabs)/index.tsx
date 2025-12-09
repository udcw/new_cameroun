
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const newsData = [
  {
    id: '1',
    title: "Nouvelle découverte dans le village Baka",
    description: "Les Baka du sud-est célèbrent un festival culturel exceptionnel...",
  },
  {
    id: '2',
    title: "Festival des danses traditionnelles à l'Ouest",
    description: "La région de l'Ouest accueille des centaines de visiteurs...",
  },
  {
    id: '3',
    title: "Les traditions culinaires des tribus du Nord",
    description: "Découvrez les plats typiques et leur histoire...",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => alert(item.title)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('@/assets/images/a.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Kamerun News</Text>
          <Text style={styles.subtitle}>Actualités tribales du Cameroun</Text>
        </View>

        <FlatList
          data={newsData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 15 },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B0082',
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 240, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#333',
  },
});

// login

// import { useRouter } from 'expo-router';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import React, { useState } from 'react';
// import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { auth } from '../../firebase/kamerun';

// export default function LoginScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const router = useRouter(); // pour navigation après connexion

//   const handleLogin = async () => {
//     try {
//       await signInWithEmailAndPassword(auth, email, password);
//       Alert.alert('Succès', 'Connexion réussie !');
//       router.push('/home'); // redirige vers la page d'accueil après login
//     } catch (error: any) {
//       Alert.alert('Erreur', error.message);
//     }
//   };

//   return (
//     <ImageBackground
//       source={require('@/assets/images/a.jpg')} // image avec motif tribal
//       style={styles.background}
//       resizeMode="cover"
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.container}>
//           <Text style={styles.title}>Se connecter</Text>

//           <TextInput
//             placeholder="Adresse e-mail"
//             value={email}
//             onChangeText={setEmail}
//             style={styles.input}
//             keyboardType="email-address"
//           />
//           <TextInput
//             placeholder="Mot de passe"
//             value={password}
//             onChangeText={setPassword}
//             style={styles.input}
//             secureTextEntry
//           />

//           <TouchableOpacity style={styles.button} onPress={handleLogin}>
//             <Text style={styles.buttonText}>Connexion</Text>
//           </TouchableOpacity>

//           <Text style={styles.link}>
//             Pas encore de compte ? <Text style={styles.linkHighlight} onPress={() => router.push('/signup')}>S'inscrire</Text>
//           </Text>
//         </View>
//       </ScrollView>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   background: { flex: 1 },
//   scrollContainer: { flexGrow: 1 },
//   container: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 240, 0.85)',
//     margin: 20,
//     borderRadius: 15,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     marginBottom: 25,
//     color: '#8B0000',
//     textAlign: 'center',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#8B0000',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 50,
//     marginBottom: 15,
//     backgroundColor: '#FFF8DC',
//   },
//   button: {
//     backgroundColor: '#FF8C00',
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   buttonText: {
//     color: '#FFF',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   link: {
//     marginTop: 15,
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#4B0082',
//   },
//   linkHighlight: {
//     fontWeight: '700',
//     color: '#8B0000',
//   },
// });


// inscription

// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import React, { useState } from 'react';
// import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { auth } from '../../firebase/kamerun';

// export default function SignUpScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [tribe, setTribe] = useState('');
//   const [phone, setPhone] = useState('');

//   const handleSignUp = async () => {
//     if (password !== confirmPassword) {
//       Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
//       return;
//     }

//     try {
//       await createUserWithEmailAndPassword(auth, email, password);
//       Alert.alert('Succès', 'Compte créé avec succès !');
//       // Ici tu peux ajouter l'enregistrement des autres infos dans Firestore
//     } catch (error: any) {
//       Alert.alert('Erreur', error.message);
//     }
//   };

//   return (
//     <ImageBackground
//       source={require('@/assets/images/a.jpg')}
//       style={styles.background}
//       resizeMode="cover"
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.container}>
//           <Text style={styles.title}>Inscription</Text>

//           <TextInput placeholder="Nom" value={lastName} onChangeText={setLastName} style={styles.input} />
//           <TextInput placeholder="Prénom" value={firstName} onChangeText={setFirstName} style={styles.input} />
//           <TextInput placeholder="Ethnie / Tribu" value={tribe} onChangeText={setTribe} style={styles.input} />
//           <TextInput
//             placeholder="Numéro de téléphone"
//             value={phone}
//             onChangeText={setPhone}
//             style={styles.input}
//             keyboardType="phone-pad"
//           />

//           <TextInput
//             placeholder="Adresse e-mail"
//             value={email}
//             onChangeText={setEmail}
//             style={styles.input}
//             keyboardType="email-address"
//           />
//           <TextInput
//             placeholder="Mot de passe"
//             value={password}
//             onChangeText={setPassword}
//             style={styles.input}
//             secureTextEntry
//           />
//           <TextInput
//             placeholder="Confirmer le mot de passe"
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             style={styles.input}
//             secureTextEntry
//           />

//           <TouchableOpacity style={styles.button} onPress={handleSignUp}>
//             <Text style={styles.buttonText}>S'inscrire</Text>
//           </TouchableOpacity>

//           <Text style={styles.link}>
//             Déjà un compte ? <Text style={styles.linkHighlight}>Se connecter</Text>
//           </Text>
//         </View>
//       </ScrollView>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   background: { flex: 1 },
//   scrollContainer: { flexGrow: 1 },
//   container: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 240, 0.85)',
//     margin: 20,
//     borderRadius: 15,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     marginBottom: 25,
//     color: '#8B0000',
//     textAlign: 'center',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#8B0000',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 50,
//     marginBottom: 15,
//     backgroundColor: '#FFF8DC',
//   },
//   button: {
//     backgroundColor: '#FF8C00',
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   buttonText: {
//     color: '#FFF',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   link: {
//     marginTop: 15,
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#4B0082',
//   },
//   linkHighlight: {
//     fontWeight: '700',
//     color: '#8B0000',
//   },
// });

// import { Image } from 'expo-image';
// import { Platform, StyleSheet } from 'react-native';

// import { HelloWave } from '@/components/hello-wave';
// import ParallaxScrollView from '@/components/parallax-scroll-view';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Link } from 'expo-router';

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12',
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <Link href="/modal">
//           <Link.Trigger>
//             <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//           </Link.Trigger>
//           <Link.Preview />
//           <Link.Menu>
//             <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
//             <Link.MenuAction
//               title="Share"
//               icon="square.and.arrow.up"
//               onPress={() => alert('Share pressed')}
//             />
//             <Link.Menu title="More" icon="ellipsis">
//               <Link.MenuAction
//                 title="Delete"
//                 icon="trash"
//                 destructive
//                 onPress={() => alert('Delete pressed')}
//               />
//             </Link.Menu>
//           </Link.Menu>
//         </Link>

//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });

// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import React, { useState } from 'react';
// import { Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { auth } from '../../firebase/kamerun';

// export default function SignUpScreen() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   const handleSignUp = async () => {
//     if (password !== confirmPassword) {
//       Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
//       return;
//     }
//     try {
//       await createUserWithEmailAndPassword(auth, email, password);
//       Alert.alert('Succès', 'Compte créé avec succès !');
//     } catch (error: any) {
//       Alert.alert('Erreur', error.message);
//     }
//   };

//   return (
//     <ImageBackground
//       source={require('@/assets/images/a.jpg')} // image avec motif tribal
//       style={styles.background}
//     >
//       <View style={styles.container}>
//         <Text style={styles.title}>Inscription</Text>

//         <TextInput
//           placeholder="Adresse e-mail"
//           value={email}
//           onChangeText={setEmail}
//           style={styles.input}
//           keyboardType="email-address"
//         />

//         <TextInput
//           placeholder="Mot de passe"
//           value={password}
//           onChangeText={setPassword}
//           style={styles.input}
//           secureTextEntry
//         />

//         <TextInput
//           placeholder="Confirmer le mot de passe"
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//           style={styles.input}
//           secureTextEntry
//         />

//         <TouchableOpacity style={styles.button} onPress={handleSignUp}>
//           <Text style={styles.buttonText}>S'inscrire</Text>
//         </TouchableOpacity>

//         <Text style={styles.link}>
//           Déjà un compte ? <Text style={styles.linkHighlight}>Se connecter</Text>
//         </Text>
//       </View>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   background: { flex: 1, resizeMode: 'cover' },
//   container: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 240, 0.85)', // léger voile pour lisibilité
//     margin: 20,
//     borderRadius: 15,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     marginBottom: 25,
//     color: '#8B0000', // couleur chaude rappelant les tissus
//     textAlign: 'center',
//     fontFamily: 'sans-serif-medium',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#8B0000',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 50,
//     marginBottom: 15,
//     backgroundColor: '#FFF8DC',
//   },
//   button: {
//     backgroundColor: '#FF8C00',
//     paddingVertical: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   buttonText: {
//     color: '#FFF',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   link: {
//     marginTop: 15,
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#4B0082',
//   },
//   linkHighlight: {
//     fontWeight: '700',
//     color: '#8B0000',
//   },
// });
