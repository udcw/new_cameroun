import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { WebView } from "react-native-webview";

const BACKEND_URL = "https://severbackendnotchpay-1.onrender.com";

class PaymentService {
  static async createPayment(amount: number, description: string) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Vous devez être connecté");
      }

      console.log("Initialisation du paiement pour:", session.user.email);
      console.log(" Montant envoyé:", amount, "FCFA");

      //  VÉRIFICATION DU MONTANT
      if (amount !== 25) {
        console.error(`ERREUR: Montant incorrect: ${amount} FCFA`);
        throw new Error(
          `Montant incorrect: ${amount} FCFA. Le prix est de 25 FCFA pour les tests.`
        );
      }

      const response = await fetch(`${BACKEND_URL}/api/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: amount,
          description: description || "Abonnement Premium TEST Kamerun News",
          phone: "",
        }),
      });

      const data = await response.json();

      console.log(" Réponse backend:", {
        success: data.success,
        message: data.message,
        mode: data.mode,
        montant_envoyé: amount,
        reference: data.data?.reference,
      });

      if (!response.ok) {
        console.error("Erreur backend:", data);
        throw new Error(
          data.message || data.error || "Erreur lors de la création du paiement"
        );
      }

      if (!data.data?.authorization_url && !data.data?.checkout_url) {
        console.error("URL de paiement manquante:", data);
        throw new Error("URL de paiement non reçue du serveur");
      }

      const paymentUrl =
        data.data?.authorization_url || data.data?.checkout_url;

      console.log("URL de paiement:", {
        url_courte: paymentUrl.substring(0, 50) + "...",
        mode: data.mode || "indéterminé",
        reference: data.data?.reference,
      });

      return {
        success: true,
        authorization_url: paymentUrl,
        reference: data.data?.reference,
        transaction_id: data.data?.transaction_id,
        mode: data.mode || (paymentUrl.includes("/test.") ? "test" : "live"),
      };
    } catch (error: any) {
      console.error(" Erreur création paiement:", error);
      return {
        success: false,
        message: error.message || "Erreur de connexion au service de paiement",
      };
    }
  }

  static async verifyPayment(reference: string) {
    try {
      console.log(`Vérification de la référence: ${reference}`);

      // GESTION DE LA SESSION
      let session;
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error("Erreur session:", sessionError);
        
        // Essayer de rafraîchir la session
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          session = refreshData.session;
          console.log("Session rafraîchie");
        } else {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
      } else {
        session = sessionData.session;
      }

      console.log(`Session valide pour: ${session.user.email}`);

      const response = await fetch(
        `${BACKEND_URL}/api/payments/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("Réponse vérification:", data);

      if (response.ok) {
        if (
          data.paid === true ||
          data.status === "complete" ||
          data.status === "terminé" ||
          data.status === "success"
        ) {
          console.log("Paiement confirmé côté backend");

          // FORCER LA MISE À JOUR DU PROFIL IMMÉDIATEMENT
          await this.updateProfileToPremium(session.user.id, reference);

          return {
            success: true,
            paid: true,
            pending: false,
            status: "complete",
            user_upgraded: true,
            message: "Paiement confirmé - Compte premium activé",
          };
        }

        if (data.pending === true || data.status === "pending") {
          return {
            success: true,
            paid: false,
            pending: true,
            status: "pending",
            user_upgraded: false,
            message: data.message || "Paiement en cours",
          };
        }

        if (
          data.status === "failed" ||
          data.status === "canceled" ||
          data.status === "cancelled"
        ) {
          return {
            success: false,
            paid: false,
            pending: false,
            status: "failed",
            message: data.message || "Paiement échoué",
          };
        }

        return {
          success: true,
          paid: false,
          pending: true,
          status: data.status || "pending",
          user_upgraded: false,
          message: data.message || "En attente de confirmation",
        };
      }

      console.error(" Erreur HTTP:", response.status, data);
      throw new Error(data.message || `Erreur ${response.status}`);
    } catch (error: any) {
      console.error("Erreur vérification paiement:", error);

      return {
        success: false,
        paid: false,
        pending: false,
        status: "error",
        message: error.message || "Erreur de vérification",
      };
    }
  }

  //  NOUVELLE MÉTHODE : METTRE À JOUR LE PROFIL VERS PREMIUM
  static async updateProfileToPremium(userId: string, reference: string) {
    try {
      console.log(`Mise à jour du profil vers premium pour: ${userId}`);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          last_payment_date: new Date().toISOString(),
          payment_reference: reference,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        console.error(" Erreur mise à jour profil:", error);
        return { success: false, message: error.message };
      }

      console.log("Profil mis à jour vers premium");
      return { success: true, message: "Profil mis à jour" };
    } catch (error: any) {
      console.error("Erreur mise à jour profil:", error);
      return { success: false, message: error.message };
    }
  }

  //  MÉTHODE AMÉLIORÉE : VÉRIFIER ET METTRE À JOUR LE STATUT
  static async checkAndUpdatePremiumStatus(userId: string, reference?: string) {
    try {
      console.log(`Vérification et mise à jour pour: ${userId}`);
      
      // Vérifier d'abord le statut actuel
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_premium, payment_reference, last_payment_date")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(" Erreur vérification profil:", error);
        return { 
          is_premium: false, 
          message: "Erreur vérification profil",
          error: true 
        };
      }

      // Si déjà premium, retourner le statut
      if (profile.is_premium) {
        console.log("Utilisateur déjà premium");
        return {
          is_premium: true,
          reference: profile.payment_reference,
          last_payment_date: profile.last_payment_date,
          error: false
        };
      }

      // Si non premium mais a une référence de paiement, vérifier avec le backend
      if (reference || profile.payment_reference) {
        const refToCheck = reference || profile.payment_reference;
        console.log(`Vérification paiement avec référence: ${refToCheck}`);
        
        const paymentStatus = await this.verifyPayment(refToCheck);
        
        if (paymentStatus.success && paymentStatus.paid) {
          // Le paiement est confirmé, mettre à jour le profil
          await this.updateProfileToPremium(userId, refToCheck);
          return {
            is_premium: true,
            reference: refToCheck,
            last_payment_date: new Date().toISOString(),
            error: false
          };
        }
      }

      return {
        is_premium: profile.is_premium || false,
        reference: profile.payment_reference,
        last_payment_date: profile.last_payment_date,
        error: false
      };
    } catch (error: any) {
      console.error("Erreur vérification/mise à jour:", error);
      return {
        is_premium: false,
        message: error.message,
        error: true
      };
    }
  }

  static async checkUserPremiumStatus() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Non connecté");
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_premium, payment_reference, updated_at, last_payment_date")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Erreur requête profil:", error);
        return {
          success: false,
          is_premium: false,
          message: "Profil incomplet",
        };
      }

      return {
        success: true,
        is_premium: profile.is_premium || false,
        reference: profile.payment_reference,
        last_payment_date: profile.last_payment_date,
        updated_at: profile.updated_at,
      };
    } catch (error: any) {
      console.error(" Erreur vérification statut premium:", error);
      return {
        success: false,
        is_premium: false,
        message: error.message,
      };
    }
  }

  static async checkBackendConfig() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/config`);
      const data = await response.json();

      return {
        success: true,
        config: data.config,
      };
    } catch (error: any) {
      console.error(" Erreur vérification config:", error);
      return {
        success: false,
        config: null,
      };
    }
  }

  //  FORCER L'ACTIVATION DIRECTE
  static async forcePremiumActivation(userId: string, reference: string) {
    try {
      console.log(
        ` Activation manuelle pour: ${userId}, référence: ${reference}`
      );

      // Mettre à jour directement dans Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          last_payment_date: new Date().toISOString(),
          payment_reference: reference,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      return {
        success: true,
        message: "Activation forcée réussie - Compte premium activé",
      };
    } catch (error: any) {
      console.error(" Erreur activation forcée:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

const newsData = [
  {
    id: "1",
    title: "Nouvelle découverte dans le village Baka",
    description:
      "Les Baka du sud-est célèbrent un festival culturel exceptionnel...",
    category: "Culture",
    date: "Il y a 2h",
  },
  {
    id: "2",
    title: "Festival des danses traditionnelles à l'Ouest",
    description: "La région de l'Ouest accueille des centaines de visiteurs...",
    category: "Événement",
    date: "Il y a 5h",
  },
  {
    id: "3",
    title: "Les traditions culinaires des tribus du Nord",
    description: "Découvrez les plats typiques et leur histoire...",
    category: "Gastronomie",
    date: "Hier",
  },
  {
    id: "4",
    title: "Cérémonie d'initiation chez les Bamiléké",
    description:
      "Une cérémonie ancestrale préservée à travers les générations...",
    category: "Tradition",
    date: "Il y a 3 jours",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [showNotchPayWebview, setShowNotchPayWebview] =
    useState<boolean>(false);
  const [notchPayUrl, setNotchPayUrl] = useState<string>("");
  const [currentTransaction, setCurrentTransaction] = useState<string>("");
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [verificationCount, setVerificationCount] = useState<number>(0);
  const [backendMode, setBackendMode] = useState<string>("");
  const [premiumCheckInterval, setPremiumCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [forceActivationLoading, setForceActivationLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        // VÉRIFICATION AVEC LA NOUVELLE MÉTHODE
        const status = await PaymentService.checkAndUpdatePremiumStatus(
          session.user.id
        );

        if (!status.error) {
          // Récupérer les données complètes du profil
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!error && profile) {
            setUserData(profile);
            setIsPremium(profile.is_premium || status.is_premium);
            console.log("📊 Statut utilisateur initial:", {
              email: session.user.email,
              is_premium: profile.is_premium || status.is_premium,
              reference: profile.payment_reference,
              last_payment_date: profile.last_payment_date,
            });
          } else {
            setIsPremium(status.is_premium);
            setUserData({
              is_premium: status.is_premium,
              payment_reference: status.reference,
              last_payment_date: status.last_payment_date,
            });
          }
        }
      }
      setLoading(false);
    };

    getSession();

    // VÉRIFICATION PÉRIODIQUE AUTOMATIQUE
    const interval = setInterval(async () => {
      if (user && !isPremium) {
        console.log("Vérification périodique du statut premium...");

        const status = await PaymentService.checkAndUpdatePremiumStatus(user.id);

        if (status.is_premium && !status.error) {
          console.log("Statut premium détecté automatiquement");
          setIsPremium(true);

          // Mettre à jour les données
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserData(profile);
          }

          // Rediriger automatiquement si le WebView est ouvert
          if (showNotchPayWebview) {
            setShowNotchPayWebview(false);
            Alert.alert(
              "Succès !",
              "Votre compte premium a été activé automatiquement.",
              [
                {
                  text: "Accéder au contenu",
                  onPress: () => router.push("/cultures-premium"),
                },
              ]
            );
          }
        }
      }
    }, 10000); // Vérifier toutes les 10 secondes

    setPremiumCheckInterval(interval);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        const status = await PaymentService.checkAndUpdatePremiumStatus(
          session.user.id
        );

        if (!status.error) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!error && profile) {
            setUserData(profile);
            setIsPremium(profile.is_premium || status.is_premium);
          } else {
            setIsPremium(status.is_premium);
          }
        }
      } else {
        setIsPremium(false);
        setUserData(null);
      }
      setLoading(false);
    });

    // VÉRIFIER LA CONFIGURATION DU BACKEND
    const checkBackendMode = async () => {
      const result = await PaymentService.checkBackendConfig();
      if (result.success && result.config) {
        setBackendMode(result.config.mode);
        console.log(`Mode backend: ${result.config.mode}`);
      }
    };

    checkBackendMode();

    return () => {
      subscription.unsubscribe();
      if (premiumCheckInterval) {
        clearInterval(premiumCheckInterval);
      }
    };
  }, [user, isPremium, showNotchPayWebview]);

  const refreshUserData = async () => {
    if (!user) return;

    try {
      console.log("Rafraîchissement des données utilisateur...");
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && profile) {
        setUserData(profile);
        setIsPremium(profile.is_premium);
        console.log("Données utilisateur rafraîchies:", {
          is_premium: profile.is_premium,
          last_payment_date: profile.last_payment_date,
          reference: profile.payment_reference,
        });
      }
    } catch (error) {
      console.error(" Erreur rafraîchissement:", error);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log("handlePaymentSuccess appelé");

    // Mettre à jour les données immédiatement
    await refreshUserData();
    setIsPremium(true);

    Alert.alert(
      "🎉 Succès !",
      "Paiement confirmé ! Votre compte premium est maintenant activé.",
      [
        {
          text: "Accéder au contenu",
          onPress: () => {
            console.log("Redirection vers /cultures-premium");
            router.push("/cultures-premium");
            setShowNotchPayWebview(false);
          },
        },
      ]
    );
  };

  const checkPaymentStatus = async (
    reference: string,
    isManualCheck: boolean = false
  ) => {
    if (checkingPayment) return;

    setCheckingPayment(true);

    try {
      console.log(`Vérification (${verificationCount + 1}/15):`, reference);

      const paymentStatus = await PaymentService.verifyPayment(reference);

      console.log(" Statut du paiement:", paymentStatus);

      const newCount = verificationCount + 1;
      setVerificationCount(newCount);

      if (newCount >= 15) {
        console.log("Limite de vérifications atteinte");

        Alert.alert(
          "Information",
          "Le paiement prend plus de temps que prévu. Votre compte sera mis à jour automatiquement dès confirmation.",
          [
            {
              text: "OK",
              onPress: () => setShowNotchPayWebview(false),
            },
          ]
        );
        return;
      }

      if (paymentStatus.success && paymentStatus.paid) {
        console.log("Paiement réussi détecté");
        await handlePaymentSuccess();
      } else if (paymentStatus.success && paymentStatus.pending) {
        console.log(`En attente (${newCount}/15)`);

        if (!isManualCheck) {
          setTimeout(() => {
            checkPaymentStatus(reference);
          }, 10000);
        }
      } else if (!paymentStatus.success) {
        Alert.alert(
          "Paiement échoué",
          paymentStatus.message || "Le paiement n'a pas pu être traité.",
          [
            {
              text: "OK",
              onPress: () => setShowNotchPayWebview(false),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Erreur vérification:", error);

      if (!isManualCheck && verificationCount < 14) {
        setTimeout(() => {
          checkPaymentStatus(reference);
        }, 15000);
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  const forcePremiumActivation = async () => {
    if (!currentTransaction || !user) {
      Alert.alert(
        "Erreur",
        "Aucune transaction en cours ou utilisateur non connecté"
      );
      return;
    }

    setForceActivationLoading(true);

    try {
      const result = await PaymentService.forcePremiumActivation(
        user.id,
        currentTransaction
      );

      if (result.success) {
        Alert.alert("Succès", result.message, [
          {
            text: "OK",
            onPress: async () => {
              await refreshUserData();
              setIsPremium(true);
              router.push("/cultures-premium");
            },
          },
        ]);
      } else {
        Alert.alert("Erreur", result.message);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setForceActivationLoading(false);
    }
  };

  const initiateNotchPayPayment = async () => {
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Veuillez vous connecter pour accéder au contenu premium",
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Se connecter",
            onPress: () => router.push("/login"),
          },
        ]
      );
      return;
    }

    if (processingPayment) {
      Alert.alert(
        "Information",
        "Un paiement est déjà en cours de traitement."
      );
      return;
    }

    // AFFICHER UN AVERTISSEMENT
    Alert.alert(
      backendMode === "TEST" ? "Mode TEST" : "Paiement",
      backendMode === "TEST"
        ? "Le système de paiement est en mode TEST. Paiement de 25 FCFA uniquement."
        : "Vous êtes sur le point d'effectuer un vrai paiement de 25 FCFA.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: `Payer 25 FCFA`,
          onPress: async () => {
            await processPayment();
          },
        },
      ]
    );
  };

  const processPayment = async () => {
    setProcessingPayment(true);

    try {
      console.log("Initialisation d'un paiement de 25 FCFA");

      const paymentResult = await PaymentService.createPayment(
        25,
        "Abonnement Premium TEST Kamerun News (25 FCFA)"
      );

      console.log(" Résultat création:", paymentResult);

      if (paymentResult.success && paymentResult.authorization_url) {
        setCurrentTransaction(paymentResult.reference || "");
        setNotchPayUrl(paymentResult.authorization_url);
        setShowNotchPayWebview(true);
        setVerificationCount(0);

        // Commencer la vérification après 5 secondes
        setTimeout(() => {
          if (paymentResult.reference) {
            checkPaymentStatus(paymentResult.reference);
          }
        }, 5000);
      } else {
        Alert.alert(
          "Erreur de Paiement",
          paymentResult.message || "Impossible de créer le paiement",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error(" Erreur initiation paiement:", error);
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleManualVerification = () => {
    if (currentTransaction) {
      checkPaymentStatus(currentTransaction, true);
    }
  };

  const checkPremiumStatusNow = async () => {
    if (!user) return;

    try {
      console.log("Vérification immédiate du statut premium...");
      const status = await PaymentService.checkAndUpdatePremiumStatus(user.id);

      if (status.is_premium && !status.error) {
        setIsPremium(true);
        await refreshUserData();
        Alert.alert(
          "Succès",
          "Votre compte premium est maintenant activé !",
          [
            {
              text: "Accéder au contenu",
              onPress: () => router.push("/cultures-premium"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Information",
          "Le statut premium n'est pas encore activé. Veuillez patienter ou vérifier à nouveau dans quelques instants."
        );
      }
    } catch (error) {
      console.error("Erreur vérification:", error);
    }
  };

  const renderWebViewModal = () => (
    <Modal
      visible={showNotchPayWebview}
      animationType="slide"
      onRequestClose={() => {
        if (currentTransaction) {
          Alert.alert(
            "Paiement en cours",
            "Votre paiement est en cours de traitement. Voulez-vous vérifier maintenant ?",
            [
              {
                text: "Vérifier maintenant",
                onPress: () => {
                  handleManualVerification();
                },
              },
              {
                text: "Vérifier statut premium",
                onPress: () => {
                  checkPremiumStatusNow();
                },
              },
              {
                text: "Forcer l'activation",
                onPress: () => {
                  forcePremiumActivation();
                },
              },
              {
                text: "Fermer et vérifier plus tard",
                style: "cancel",
                onPress: () => {
                  setShowNotchPayWebview(false);
                },
              },
            ]
          );
        } else {
          setShowNotchPayWebview(false);
        }
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.webviewHeader}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Quitter la page de paiement",
                "Votre paiement est-il terminé ?",
                [
                  {
                    text: "Non, rester",
                    style: "cancel",
                  },
                  {
                    text: "Oui, quitter",
                    onPress: () => {
                      setShowNotchPayWebview(false);
                    },
                  },
                ]
              );
            }}
            style={styles.closeWebViewButton}
          >
            <Ionicons name="close" size={24} color="#8B0000" />
            <Text style={styles.closeWebViewText}>Fermer</Text>
          </TouchableOpacity>
          <View style={styles.webviewTitleContainer}>
            <Text style={styles.webviewTitle}>Paiement sécurisé NotchPay</Text>
            <Text style={styles.webviewSubtitle}>
              Mode: {backendMode === "TEST" ? "TEST (25 FCFA)" : "LIVE"}
            </Text>
          </View>
        </View>

        <WebView
          source={{ uri: notchPayUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            console.log(" Navigation WebView:", navState.url);

            const isPaymentCompleted =
              navState.url.includes("/success") ||
              navState.url.includes("/completed") ||
              navState.url.includes("/callback") ||
              navState.url.includes("/return");

            if (isPaymentCompleted) {
              console.log(" Redirection après paiement détectée");
              setShowNotchPayWebview(false);

              // Vérifier immédiatement le statut
              setTimeout(() => {
                if (currentTransaction) {
                  checkPaymentStatus(currentTransaction);
                }
              }, 2000);
            }
          }}
          onError={(error) => {
            console.error("Erreur WebView:", error);
            Alert.alert(
              "Erreur",
              "Impossible de charger la page de paiement.",
              [{ text: "OK", onPress: () => setShowNotchPayWebview(false) }]
            );
          }}
        />
        <View style={styles.webviewFooter}>
          <Text style={styles.webviewFooterText}>
            {backendMode === "TEST"
              ? 'Mode TEST : Paiement de test à 25 FCFA. Cliquez sur "Simuler le paiement" dans la page NotchPay.'
              : "Paiement LIVE : Vous allez être redirigé vers la page de paiement sécurisée."}
          </Text>
          {currentTransaction && (
            <View style={styles.verificationContainer}>
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: "#27AE60" }]}
                onPress={handleManualVerification}
                disabled={checkingPayment}
              >
                {checkingPayment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text style={styles.verifyButtonText}>
                      Vérifier paiement
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: "#2980B9", marginTop: 5 },
                ]}
                onPress={checkPremiumStatusNow}
              >
                <Ionicons name="star" size={16} color="#FFF" />
                <Text style={styles.verifyButtonText}>
                  Vérifier statut premium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: "#FFA500", marginTop: 5 },
                ]}
                onPress={forcePremiumActivation}
                disabled={forceActivationLoading}
              >
                {forceActivationLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="warning" size={16} color="#FFF" />
                    <Text style={styles.verifyButtonText}>
                      Forcer l'activation
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.verificationCountText}>
                Vérifications: {verificationCount}/15
              </Text>
              <Text style={styles.transactionText}>
                Réf: {currentTransaction.substring(0, 15)}...
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderItem = ({
    item,
  }: {
    item: {
      id: string;
      title: string;
      description: string;
      category: string;
      date: string;
    };
  }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => alert(item.title)}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) },
            ]}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.readTime}>2 min de lecture</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Culture: "#E67E22",
      Événement: "#9B59B6",
      Gastronomie: "#27AE60",
      Tradition: "#2980B9",
    };
    return colors[category] || "#34495E";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/a.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.appTitle}>Kamerun News</Text>
            <Text style={styles.subtitle}>Actualités tribales du Cameroun</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="eye" size={20} color="#8B0000" />
                <Text style={styles.statText}>+500 lectures</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={20} color="#8B0000" />
                <Text style={styles.statText}>98% aiment</Text>
              </View>
            </View>
            {user && isPremium && (
              <View style={styles.premiumBadgeHeader}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Compte Premium</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>À la une</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Populaire</Text>
            </View>
            <Text style={styles.featuredTitle}>Le Festival Ngondo 2024</Text>
            <Text style={styles.featuredDescription}>
              La plus grande célébration culturelle Sawa revient avec des
              traditions ancestrales...
            </Text>
          </View>
        </View>

        {!isPremium ? (
          <View style={styles.premiumSection}>
            <View style={styles.premiumCard}>
              <View style={styles.premiumBadge}>
                <Ionicons name="lock-closed" size={24} color="#FFD700" />
              </View>
              <Text style={styles.premiumTitle}>Contenu Premium</Text>
              <Text style={styles.premiumDescription}>
                Débloquez l'accès complet à toutes les cultures du Cameroun avec
                des détails exclusifs, photos et vidéos.
              </Text>

              <View style={styles.pricingContainer}>
                <Text style={styles.originalPrice}>2000 FCFA</Text>
                <Text style={styles.discountedPrice}>25 FCFA</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-99%</Text>
                </View>
              </View>

              {backendMode && (
                <View
                  style={[
                    styles.modeBadge,
                    {
                      backgroundColor:
                        backendMode === "TEST" ? "#FFA500" : "#27AE60",
                    },
                  ]}
                >
                  <Ionicons
                    name={backendMode === "TEST" ? "flask" : "shield-checkmark"}
                    size={14}
                    color="#FFF"
                  />
                  <Text style={styles.modeBadgeText}>
                    {backendMode === "TEST"
                      ? "Mode TEST (25 FCFA)"
                      : "Mode LIVE"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  processingPayment && { backgroundColor: "#aaa" },
                ]}
                onPress={initiateNotchPayPayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#FFF" />
                    <Text style={styles.paymentButtonText}>Payer 25 FCFA</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.paymentMethodsPreview}>
                <Text style={styles.paymentMethodsTitle}>
                  Paiements sécurisés via NotchPay:
                </Text>
                <View style={styles.paymentMethodsIcons}>
                  <Text style={styles.paymentMethodPreview}>
                    MTN Mobile Money
                  </Text>
                  <Text style={styles.paymentMethodPreview}>
                    Orange Money
                  </Text>
                  <Text style={styles.paymentMethodPreview}>
                    Carte bancaire
                  </Text>
                </View>
              </View>

              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#27AE60" />
                <Text style={styles.securityTextSmall}>
                  Sécurisé par NotchPay
                </Text>
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.featureText}>6 cultures détaillées</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.featureText}>Photos exclusives</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.featureText}>Vidéos traditionnelles</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                  <Text style={styles.featureText}>Accès à vie</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.premiumSection}>
            <View style={styles.premiumCard}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
              <Text style={styles.premiumTitle}>Vous êtes Premium !</Text>
              <Text style={styles.premiumDescription}>
                Profitez de l'accès complet à toutes les cultures du Cameroun.
              </Text>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => {
                  console.log(" Navigation vers cultures premium");
                  router.push("/cultures-premium");
                }}
              >
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                <Text style={styles.paymentButtonText}>
                  Accéder aux cultures
                </Text>
              </TouchableOpacity>

              <View style={styles.premiumInfo}>
                <View style={styles.premiumInfoItem}>
                  <Ionicons name="calendar" size={16} color="#8B0000" />
                  <Text style={styles.premiumInfoText}>
                    Activé le:{" "}
                    {userData?.last_payment_date
                      ? new Date(userData.last_payment_date).toLocaleDateString(
                          "fr-FR"
                        )
                      : userData?.updated_at
                      ? new Date(userData.updated_at).toLocaleDateString(
                          "fr-FR"
                        )
                      : "Récemment"}
                  </Text>
                </View>
                {userData?.payment_reference && (
                  <View style={styles.premiumInfoItem}>
                    <Ionicons name="receipt" size={16} color="#8B0000" />
                    <Text style={styles.premiumInfoText}>
                      Réf: {userData.payment_reference.substring(0, 15)}...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.newsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières actualités</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Tout voir</Text>
              <Ionicons name="chevron-forward" size={16} color="#8B0000" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={newsData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Explorer</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="map" size={24} color="#8B0000" />
              <Text style={styles.actionText}>Cartes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar" size={24} color="#8B0000" />
              <Text style={styles.actionText}>Événements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="restaurant" size={24} color="#8B0000" />
              <Text style={styles.actionText}>Cuisine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="musical-notes" size={24} color="#8B0000" />
              <Text style={styles.actionText}>Danses</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderWebViewModal()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B0000",
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 240, 0.95)",
    padding: 20,
    borderRadius: 20,
    width: Dimensions.get("window").width - 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B0082",
    marginBottom: 15,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  premiumBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B0000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  premiumBadgeText: {
    color: "#FFD700",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 5,
  },
  featuredSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#8B0000",
    marginBottom: 15,
  },
  featuredCard: {
    backgroundColor: "rgba(139, 0, 0, 0.9)",
    borderRadius: 15,
    padding: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  featuredBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B0000",
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  premiumSection: {
    marginBottom: 30,
  },
  premiumCard: {
    backgroundColor: "rgba(255, 255, 240, 0.95)",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: -15,
    alignSelf: "center",
    backgroundColor: "#8B0000",
    padding: 10,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#8B0000",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  premiumDescription: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  pricingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  originalPrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: "#27AE60",
  },
  discountBadge: {
    position: "absolute",
    right: -50,
    top: -10,
    backgroundColor: "#E74C3C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 15,
    alignSelf: "center",
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 5,
  },
  paymentButton: {
    backgroundColor: "#27AE60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginLeft: 10,
  },
  featuresList: {
    width: "100%",
    marginTop: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    fontWeight: "500",
  },
  newsSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: "#8B0000",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 10,
  },
  card: {
    backgroundColor: "rgba(255, 255, 240, 0.95)",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#8B0000",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#8B0000",
    marginBottom: 8,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  readTime: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 15,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 240, 0.95)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#8B0000",
    textAlign: "center",
  },
  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF8DC",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeWebViewButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  closeWebViewText: {
    fontSize: 14,
    color: "#8B0000",
    marginLeft: 5,
    fontWeight: "600",
  },
  webviewTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  webviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8B0000",
    textAlign: "center",
  },
  webviewSubtitle: {
    fontSize: 12,
    color: "#27AE60",
    fontWeight: "700",
    marginTop: 2,
  },
  webviewFooter: {
    padding: 15,
    backgroundColor: "#FFF8DC",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  webviewFooterText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 16,
  },
  verificationContainer: {
    alignItems: "center",
    gap: 5,
  },
  verifyButton: {
    backgroundColor: "#8B0000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 180,
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  verificationCountText: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
  },
  transactionText: {
    fontSize: 9,
    color: "#888",
    fontFamily: "monospace",
  },
  paymentMethodsPreview: {
    marginBottom: 15,
    alignItems: "center",
  },
  paymentMethodsTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  paymentMethodsIcons: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  paymentMethodPreview: {
    fontSize: 12,
    color: "#8B0000",
    fontWeight: "500",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  securityTextSmall: {
    fontSize: 10,
    color: "#27AE60",
    fontWeight: "500",
    marginLeft: 3,
  },
  premiumInfo: {
    width: "100%",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  premiumInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "center",
  },
  premiumInfoText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
});