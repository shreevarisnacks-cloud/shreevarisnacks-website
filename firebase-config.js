// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAPVRH8VPPdhGVMF6NZFs7SXFUDVADpmg8",
  authDomain: "shreevarisnacks-45d0d.firebaseapp.com",
  projectId: "shreevarisnacks-45d0d",
  storageBucket: "shreevarisnacks-45d0d.firebasestorage.app",
  messagingSenderId: "834301462418",
  appId: "1:834301462418:web:291d73b35f0b6c3d96634b",
  measurementId: "G-NX2PML1RMQ"
};

// Initialize Firebase
let app, auth, db, storage;

// Check if Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
    // Initialize Firebase
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    console.log('Firebase initialized successfully');
} else {
    console.error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
}

// Auth State Observer
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User logged in:', user.email);
            // Store user data in session
            sessionStorage.setItem('userEmail', user.email);
            sessionStorage.setItem('userId', user.uid);
        } else {
            console.log('User logged out');
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('userId');
        }
    });
}

// Helper Functions
const FirebaseHelper = {
    // Check if user is logged in
    isLoggedIn: () => {
        return auth && auth.currentUser !== null;
    },
    
    // Get current user
    getCurrentUser: () => {
        return auth ? auth.currentUser : null;
    },
    
    // Sign out
    signOut: async () => {
        if (auth) {
            await auth.signOut();
            window.location.href = 'index.html';
        }
    },
    
    // Check if user is admin
    isAdmin: async () => {
        const user = FirebaseHelper.getCurrentUser();
        if (!user) return false;
        
        try {
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            return adminDoc.exists;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
};

// Make FirebaseHelper globally available
window.FirebaseHelper = FirebaseHelper;
