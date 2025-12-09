import axios from 'axios';

const API_BASE_URL = 'https://severbackendnotchpay.onrender.com'; // Remplacez par votre URL de production

class PaymentService {
  static async initiatePayment(paymentData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/initiate`, paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de paiement');
    }
  }

  static async verifyPayment(reference) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur de vérification');
    }
  }

  static async getPaymentHistory(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/history`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur historique');
    }
  }
}

export default PaymentService;