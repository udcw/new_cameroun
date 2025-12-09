// services/backendService.ts
const BACKEND_URL =  "https://severbackendnotchpay.onrender.com";  // ← ton IP réelle
 // Changez pour votre URL de production

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  authorizationUrl?: string;
  notchpayReference?: string;
  error?: string;
}

export interface UserStatus {
  success: boolean;
  isPremium: boolean;
  premiumActivatedAt?: any;
  lastPaymentDate?: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: '📱',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    icon: '🍊',
  },
];

// Vérifier la santé du backend
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend non disponible:', error);
    return false;
  }
};

// Initier un paiement via le backend
export const initiateBackendPayment = async (
  amount: number,
  phoneNumber: string,
  paymentMethod: string,
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<PaymentResult> => {
  try {
    console.log('Initiation du paiement via backend...', {
      amount,
      phoneNumber,
      paymentMethod,
      userId
    });

    const response = await fetch(`${BACKEND_URL}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        phone: phoneNumber,
        method: paymentMethod,
        userId,
        email: userEmail,
        name: userName
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'initiation du paiement');
    }

    return data;

  } catch (error) {
    console.error('Erreur initiation paiement backend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de paiement inconnue',
    };
  }
};

// Vérifier le statut d'un paiement via le backend
export const checkBackendPaymentStatus = async (transactionId: string): Promise<{status: string; paid: boolean; error?: string}> => {
  try {
    const response = await fetch(`${BACKEND_URL}/payments/status/${transactionId}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du statut');
    }

    const data = await response.json();
    return {
      status: data.status,
      paid: data.paid,
      error: data.error
    };
  } catch (error) {
    console.error('Erreur vérification statut backend:', error);
    return { 
      status: 'error', 
      paid: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

// Vérifier le statut premium d'un utilisateur
export const getUserPremiumStatus = async (userId: string): Promise<UserStatus> => {
  try {
    const response = await fetch(`${BACKEND_URL}/users/${userId}/status`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du statut');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur vérification statut utilisateur:', error);
    return {
      success: false,
      isPremium: false
    };
  }
};

// Récupérer l'historique des transactions
export const getUserTransactions = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/users/${userId}/transactions`);
    
    if (response.ok) {
      const data = await response.json();
      return data.transactions || [];
    }
    return [];
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    return [];
  }
};

// Vérifier le format du numéro de téléphone
export const validatePhoneNumber = (phone: string, provider: string): { isValid: boolean; message?: string } => {
  const cleaned = phone.replace(/\s/g, '');
  
  if (!/^(237)?[67][0-9]{8}$/.test(cleaned)) {
    return {
      isValid: false,
      message: 'Le numéro doit commencer par 6 ou 7 et contenir 9 chiffres'
    };
  }
  
  if (provider === 'mtn') {
    if (!/^(237)?6[5-9][0-9]{7}$/.test(cleaned)) {
      return {
        isValid: false,
        message: 'Numéro MTN invalide. Doit commencer par 65-69'
      };
    }
  } else if (provider === 'orange') {
    if (!/^(237)?6[5-9][0-9]{7}$/.test(cleaned) && !/^(237)?7[5-9][0-9]{7}$/.test(cleaned)) {
      return {
        isValid: false,
        message: 'Numéro Orange invalide. Doit commencer par 65-69 ou 75-79'
      };
    }
  }
  
  return { isValid: true };
};

// Formater le numéro de téléphone
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('237')) {
    return cleaned;
  }
  if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
    return `237${cleaned}`;
  }
  return cleaned;
};