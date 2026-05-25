// ========================================
// LOGIN & SIGNUP SYSTEM
// ========================================

// Check if already logged in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Already logged in - check if admin or customer
        try {
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            
            if (adminDoc.exists) {
                // Admin user
                window.location.href = 'admin-dashboard.html';
            } else {
                // Regular customer - redirect to home or cart
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || 'index.html';
                window.location.href = redirect;
            }
        } catch (error) {
            console.error('Error checking user type:', error);
        }
    }
});

// Login form
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if admin
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        
        if (adminDoc.exists) {
            // Admin login
            window.location.href = 'admin-dashboard.html';
        } else {
            // Customer login
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = redirect;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. ';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many failed attempts. Try again later.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});

// Signup form
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    if (phone && !/^[0-9]{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save customer data to Firestore
        await db.collection('customers').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone,
            createdAt: new Date().toISOString(),
            role: 'customer'
        });
        
        alert('✅ Account created successfully!\n\nYou can now place orders.');
        
        // Redirect to cart or home
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Signup failed. ';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak. Use at least 6 characters.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});

// Toggle between login and signup
document.getElementById('showSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginFormContainer').classList.add('hidden');
    document.getElementById('signupFormContainer').classList.remove('hidden');
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupFormContainer').classList.add('hidden');
    document.getElementById('loginFormContainer').classList.remove('hidden');
});

// Password reset
document.getElementById('forgotPassword')?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = prompt('Enter your email address:');
    
    if (!email) return;
    
    try {
        await auth.sendPasswordResetEmail(email);
        alert('✅ Password reset email sent!\n\nCheck your inbox and follow the instructions.');
    } catch (error) {
        console.error('Password reset error:', error);
        alert('Error sending password reset email. Please check the email address.');
    }
});
