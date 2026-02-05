// Admin Login Form Submission
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const adminLoginMessage = document.getElementById('adminLoginMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const securityCode = document.getElementById('securityCode').value;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        adminLoginMessage.textContent = 'Firebase is not initialized. Please refresh the page and try again.';
        adminLoginMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Dashboard';
        return;
    }
    
    if (!auth || !db) {
        adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        adminLoginMessage.textContent = 'Authentication service is not available. Please refresh the page.';
        adminLoginMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Dashboard';
        return;
    }
    
    try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('User signed in:', user.uid);
        
        // Check if user is admin
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        
        if (!adminDoc.exists) {
            // Not an admin, sign out
            await auth.signOut();
            
            adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
            adminLoginMessage.textContent = 'Unauthorized access. This account is not an admin account.';
            adminLoginMessage.classList.remove('hidden');
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Access Dashboard';
            return;
        }
        
        console.log('Admin document found');
        
        // Verify security code
        const adminData = adminDoc.data();
        if (adminData.securityCode !== securityCode) {
            await auth.signOut();
            
            adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
            adminLoginMessage.textContent = 'Invalid security code. Access denied.';
            adminLoginMessage.classList.remove('hidden');
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Access Dashboard';
            return;
        }
        
        console.log('Security code verified');
        
        // Log admin access
        await db.collection('adminLogs').add({
            adminId: user.uid,
            email: user.email,
            action: 'login',
            timestamp: new Date().toISOString(),
            ip: 'N/A' // In production, you'd capture the actual IP
        });
        
        // Show success message
        adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
        adminLoginMessage.textContent = 'Authentication successful! Accessing dashboard...';
        adminLoginMessage.classList.remove('hidden');
        
        // Redirect to admin dashboard
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Admin login error:', error);
        
        let errorMessage = 'Authentication failed. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Admin account not found.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }
        
        // Log failed attempt
        try {
            await db.collection('adminLogs').add({
                email: email,
                action: 'failed_login',
                timestamp: new Date().toISOString(),
                error: error.code || 'unknown'
            });
        } catch (logError) {
            console.error('Error logging failed attempt:', logError);
        }
        
        adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        adminLoginMessage.textContent = errorMessage;
        adminLoginMessage.classList.remove('hidden');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Dashboard';
    }
});

// Check if admin is already logged in
window.addEventListener('load', () => {
    console.log('Admin login page loaded');
    console.log('Firebase initialized:', typeof firebase !== 'undefined' && firebase.apps.length > 0);
    
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User detected:', user.uid);
                // Check if user is admin
                try {
                    const adminDoc = await db.collection('admins').doc(user.uid).get();
                    if (adminDoc.exists) {
                        // Admin is already logged in, redirect to dashboard
                        console.log('Admin already logged in, redirecting...');
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        console.log('User is not admin, staying on login page');
                    }
                } catch (error) {
                    console.error('Error checking admin status:', error);
                }
            } else {
                console.log('No user logged in');
            }
        });
    } else {
        console.error('Auth is not initialized');
    }
});
