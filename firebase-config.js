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

// Cloudinary Configuration
// Replace these with your Cloudinary credentials from https://cloudinary.com/console
const cloudinaryConfig = {
  cloudName: "dbdixubzv",  // e.g., "shreevari-snacks"
  uploadPreset: "shreevari-upload"  // Create an unsigned upload preset in Cloudinary settings
};

// Initialize Firebase
let app, auth, db;

// Check if Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        console.log('Firebase initialized successfully');
        console.log('Auth:', auth);
        console.log('Firestore:', db);
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
} else {
    console.error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
}

// Cloudinary Upload Helper
const CloudinaryHelper = {
    // Upload image to Cloudinary
    uploadImage: async (file) => {
        if (!cloudinaryConfig.cloudName || cloudinaryConfig.cloudName === 'YOUR_CLOUD_NAME') {
            throw new Error('Cloudinary not configured. Please update cloudinaryConfig in firebase-config.js');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', 'shreevari-snacks'); // Organize images in a folder
        
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            return {
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    },
    
    // Generate optimized image URL
    getOptimizedUrl: (publicId, width = 800, quality = 'auto') => {
        if (!cloudinaryConfig.cloudName || cloudinaryConfig.cloudName === 'YOUR_CLOUD_NAME') {
            return publicId; // Return original URL if Cloudinary not configured
        }
        return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/w_${width},q_${quality},f_auto/${publicId}`;
    },
    
    // Delete image from Cloudinary (requires server-side implementation for security)
    // This is a placeholder - actual deletion should be done server-side with API key
    deleteImage: async (publicId) => {
        console.warn('Image deletion should be implemented server-side for security');
        // For now, just remove from database, keep in Cloudinary
        return true;
    }
};

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

// Make helpers globally available
window.FirebaseHelper = FirebaseHelper;
window.CloudinaryHelper = CloudinaryHelper;
window.cloudinaryConfig = cloudinaryConfig;
