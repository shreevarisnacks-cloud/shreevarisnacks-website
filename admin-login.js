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
    
    if (!auth || !db) {
        adminLoginMessage.className = 'mt-4 p-4 rounded-xl bg-red-100 text-red-800';
        adminLoginMessage.textContent = 'Authentication service is not available. Please try again later.';
        adminLoginMessage.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Dashboard';
        return;
    }
    
    try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
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
        }, 1500);
    } catch (error) {
        console.error('Admin login error:', error);
        
        let errorMessage = 'Authentication failed. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Admin account not found.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
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
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Check if user is admin
                try {
                    const adminDoc = await db.collection('admins').doc(user.uid).get();
                    if (adminDoc.exists) {
                        // Admin is already logged in, redirect to dashboard
                        window.location.href = 'admin-dashboard.html';
                    }
                } catch (error) {
                    console.error('Error checking admin status:', error);
                }
            }
        });
    }
});
