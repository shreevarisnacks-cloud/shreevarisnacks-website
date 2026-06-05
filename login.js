// ========================================
// LOGIN & SIGNUP SYSTEM - COMPLETE & FIXED
// ========================================

console.log('📄 Login page loaded');

// Wait for Firebase
function waitForAuth(callback, attempts = 0) {
    if (attempts > 10) {
        console.error('❌ Firebase not ready');
        alert('System error. Please refresh page.');
        return;
    }
    
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        console.log('✅ Firebase ready');
        callback();
    } else {
        console.log('⏳ Waiting for Firebase...');
        setTimeout(() => waitForAuth(callback, attempts + 1), 500);
    }
}

// Initialize when Firebase is ready
waitForAuth(() => {
    console.log('🚀 Initializing login system');
    
    // Check if already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ User already logged in:', user.email);
            
            // Check if admin
            checkUserType(user);
        } else {
            console.log('ℹ️ Not logged in, showing login form');
        }
    });
    
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    console.log('⚙️ Setting up event listeners');
    
    // LOGIN FORM
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form ready');
    } else {
        console.error('❌ loginForm not found!');
    }
    
    // SIGNUP FORM
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('✅ Signup form ready');
    } else {
        console.error('❌ signupForm not found!');
    }
    
    // SHOW SIGNUP - Open modal
    const showSignupBtn = document.getElementById('showSignup');
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Opening signup modal');
            const modal = document.getElementById('signupModal');
            if (modal) {
                modal.classList.remove('hidden');
                // Clear form
                if (signupForm) signupForm.reset();
            }
        });
        console.log('✅ Show signup button ready');
    } else {
        console.error('❌ showSignup button not found!');
    }
    
    // CLOSE SIGNUP - Close modal
    const closeSignupBtn = document.getElementById('closeSignup');
    if (closeSignupBtn) {
        closeSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Closing signup modal');
            const modal = document.getElementById('signupModal');
            if (modal) modal.classList.add('hidden');
        });
        console.log('✅ Close signup button ready');
    } else {
        console.error('❌ closeSignup button not found!');
    }
    
    // Close modal when clicking outside
    const signupModal = document.getElementById('signupModal');
    if (signupModal) {
        signupModal.addEventListener('click', (e) => {
            if (e.target === signupModal) {
                console.log('🔄 Closing modal (clicked outside)');
                signupModal.classList.add('hidden');
            }
        });
    }
    
    // FORGOT PASSWORD - FIXED!
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
        console.log('✅ Forgot password button ready');
    } else {
        console.error('❌ forgotPassword button not found!');
    }
    
    // MOBILE MENU
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const menu = document.getElementById('mobileMenu');
            if (menu) menu.classList.toggle('hidden');
        });
    }
}

// ========================================
// LOGIN
// ========================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        alert('⚠️ Please enter email and password');
        return;
    }
    
    console.log('🔐 Logging in:', email);
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn?.textContent;
    if (btn) btn.textContent = 'Logging in...';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Login successful:', user.email);
        
        // Check user type
        checkUserType(user);
        
    } catch (error) {
        console.error('❌ Login error:', error.code, error.message);
        
        let message = 'Login failed. ';
        
        if (error.code === 'auth/user-not-found') {
            message += 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            message += 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            message += 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            message += 'Too many failed attempts. Try again later.';
        } else if (error.code === 'auth/user-disabled') {
            message += 'This account has been disabled.';
        } else {
            message += error.message;
        }
        
        alert(message);
    } finally {
        if (btn) btn.textContent = originalText;
    }
}

// ========================================
// SIGNUP
// ========================================

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName')?.value;
    const email = document.getElementById('signupEmail')?.value;
    const phone = document.getElementById('signupPhone')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    
    console.log('📝 Signup attempt:', email);
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        alert('⚠️ Please fill all required fields (marked with *)');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('⚠️ Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('⚠️ Password must be at least 6 characters');
        return;
    }
    
    if (phone && !/^[0-9]{10}$/.test(phone)) {
        alert('⚠️ Please enter a valid 10-digit phone number');
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn?.textContent;
    if (btn) btn.textContent = 'Creating account...';
    
    try {
        console.log('🔐 Creating user account...');
        
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Account created:', user.uid);
        
        // Save customer data to Firestore
        console.log('💾 Saving customer data...');
        
        await db.collection('customers').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone || '',
            createdAt: new Date().toISOString(),
            role: 'customer'
        });
        
        console.log('✅ Customer data saved');
        
        alert('✅ Account created successfully!\n\nYou can now login and place orders.');
        
        // Close modal
        const modal = document.getElementById('signupModal');
        if (modal) modal.classList.add('hidden');
        
        // Clear form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) signupForm.reset();
        
        // Pre-fill login email
        const loginEmailInput = document.getElementById('loginEmail');
        if (loginEmailInput) loginEmailInput.value = email;
        
        // Focus on password field
        const loginPasswordInput = document.getElementById('loginPassword');
        if (loginPasswordInput) loginPasswordInput.focus();
        
    } catch (error) {
        console.error('❌ Signup error:', error.code, error.message);
        
        let message = 'Signup failed. ';
        
        if (error.code === 'auth/email-already-in-use') {
            message += 'An account with this email already exists. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            message += 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            message += 'Password is too weak. Use at least 6 characters.';
        } else if (error.code === 'auth/operation-not-allowed') {
            message += 'Signup is not enabled. Contact admin.';
        } else {
            message += error.message;
        }
        
        alert(message);
    } finally {
        if (btn) btn.textContent = originalText;
    }
}

// ========================================
// FORGOT PASSWORD - WORKING!
// ========================================

async function handleForgotPassword(e) {
    if (e) e.preventDefault();
    
    console.log('🔑 Forgot password clicked');
    
    const email = prompt('Enter your email address:');
    
    if (!email) {
        console.log('❌ No email entered');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('⚠️ Please enter a valid email address');
        return;
    }
    
    console.log('📧 Sending password reset email to:', email);
    
    try {
        await auth.sendPasswordResetEmail(email);
        
        console.log('✅ Password reset email sent');
        
        alert('✅ Password reset email sent!\n\n' +
              'Check your inbox for a link to reset your password.\n\n' +
              'If you don\'t see it in 5 minutes, check your spam folder.');
        
    } catch (error) {
        console.error('❌ Password reset error:', error.code, error.message);
        
        let message = 'Error sending reset email. ';
        
        if (error.code === 'auth/user-not-found') {
            message += 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            message += 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            message += 'Too many attempts. Try again later.';
        } else {
            message += error.message;
        }
        
        alert(message);
    }
}

// ========================================
// CHECK USER TYPE & REDIRECT
// ========================================

async function checkUserType(user) {
    try {
        console.log('🔍 Checking user type...');
        
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        
        if (adminDoc.exists) {
            console.log('👨‍💼 User is admin');
            window.location.href = 'admin-dashboard.html';
        } else {
            console.log('👤 User is customer');
            
            // Get redirect URL from query params
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            
            console.log('🔀 Redirecting to:', redirect);
            window.location.href = redirect;
        }
        
    } catch (error) {
        console.error('❌ Error checking user type:', error);
        
        // Default to customer view
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
    }
}

console.log('✅ Login system loaded');
