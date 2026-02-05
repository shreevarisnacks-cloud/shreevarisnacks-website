// Mobile Menu Toggle
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
});

// Show/Hide Signup Modal
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupModal').classList.remove('hidden');
});

document.getElementById('closeSignup').addEventListener('click', () => {
    document.getElementById('signupModal').classList.add('hidden');
});

// Close modal on outside click
document.getElementById('signupModal').addEventListener('click', (e) => {
    if (e.target.id === 'signupModal') {
        document.getElementById('signupModal').classList.add('hidden');
    }
});

// Login Form Submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginMessage = document.getElementById('loginMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    if (!auth) {
        loginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        loginMessage.textContent = 'Authentication service is not available. Please try again later.';
        loginMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        return;
    }
    
    try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Show success message
        loginMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
        loginMessage.textContent = 'Login successful! Redirecting...';
        loginMessage.classList.remove('hidden');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Invalid email or password. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address format.';
        }
        
        loginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        loginMessage.textContent = errorMessage;
        loginMessage.classList.remove('hidden');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

// Signup Form Submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const signupMessage = document.getElementById('signupMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        signupMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        signupMessage.textContent = 'Passwords do not match!';
        signupMessage.classList.remove('hidden');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    if (!auth || !db) {
        signupMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        signupMessage.textContent = 'Service is not available. Please try again later.';
        signupMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
    }
    
    try {
        // Create user with Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: name
        });
        
        // Save additional user data to Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone,
            createdAt: new Date().toISOString()
        });
        
        // Show success message
        signupMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
        signupMessage.textContent = 'Account created successfully! Redirecting...';
        signupMessage.classList.remove('hidden');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Error creating account. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address format.';
        }
        
        signupMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        signupMessage.textContent = errorMessage;
        signupMessage.classList.remove('hidden');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

// Check if user is already logged in
window.addEventListener('load', () => {
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is already logged in, redirect to home
                window.location.href = 'index.html';
            }
        });
    }
});
