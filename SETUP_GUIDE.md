# Shreevari Snacks - Quick Setup Guide

This guide will help you set up the website in 15 minutes.

## Step 1: Firebase Setup (5 minutes)

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "shreevari-snacks"
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, click "Authentication" in left menu
2. Click "Get started"
3. Click "Email/Password" under "Native providers"
4. Enable "Email/Password"
5. Click "Save"

### 1.3 Enable Firestore Database
1. Click "Firestore Database" in left menu
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location (closest to your users)
5. Click "Enable"

### 1.4 Enable Storage
1. Click "Storage" in left menu
2. Click "Get started"
3. Use default security rules
4. Click "Done"

### 1.5 Get Firebase Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings" 
3. Scroll to "Your apps"
4. Click the web icon `</>`
5. Register app name: "shreevari-snacks-web" 
6. Copy the firebaseConfig object
7. Open `firebase-config.js` file
8. Replace the configuration values with your copied values

## Step 2: Update HTML Files (2 minutes)

Add Firebase SDK scripts to **ALL HTML files** (index.html, menu.html, contact.html, login.html, admin-login.html, admin-dashboard.html).

Add these lines **BEFORE** the `</body>` tag and **BEFORE** `firebase-config.js`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
<script src="firebase-config.js"></script>
```

## Step 3: Set Firestore Rules (2 minutes)

1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Copy and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    match /offers/{offerId} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /contactMessages/{messageId} {
      allow create: if true;
      allow read: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    match /adminLogs/{logId} {
      allow create: if true;
      allow read: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

4. Click "Publish"

## Step 4: Create Admin Account (3 minutes)

### 4.1 Create User in Authentication
1. Go to "Authentication" > "Users" tab
2. Click "Add user"
3. Email: `admin@shreevarisnacks.in` (or your preferred email)
4. Password: Create a strong password
5. Click "Add user"
6. **COPY THE UID** (the long string under "User UID")

### 4.2 Create Admin Document in Firestore
1. Go to "Firestore Database"
2. Click "Start collection"
3. Collection ID: `admins`
4. Document ID: **Paste the UID you copied**
5. Add these fields:
   - Field: `name`, Type: string, Value: `Your Name`
   - Field: `email`, Type: string, Value: `admin@shreevarisnacks.in`
   - Field: `securityCode`, Type: string, Value: `123456` (change this!)
   - Field: `createdAt`, Type: string, Value: `2024-02-05T00:00:00.000Z`
6. Click "Save"

## Step 5: Add Sample Data (3 minutes)

### 5.1 Import Menu Items
You can either:
- **Option A**: Use the Firebase console to manually add items from `sample-data.json`
- **Option B**: Use the admin dashboard after deployment to add items

### 5.2 Add Sample Offers
1. In Firestore, create collection `offers`
2. Add documents with these fields:
   - `title`: "Buy 1 Get 1 Free"
   - `description`: "On all pizzas every Wednesday!"
   - `price`: "50% OFF"
   - `badge`: "HOT DEAL"
   - `active`: true
   - `createdAt`: Current timestamp

## Step 6: Deploy to GitHub Pages (5 minutes)

### 6.1 Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Repository name: `shreevari-snacks`
4. Make it Public
5. Click "Create repository"

### 6.2 Upload Files
1. Open your terminal/command prompt
2. Navigate to the project folder
3. Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/shreevari-snacks.git
   git push -u origin main
   ```

### 6.3 Enable GitHub Pages
1. Go to repository "Settings"
2. Click "Pages" in left menu
3. Under "Source", select "main" branch
4. Click "Save"
5. Wait 1-2 minutes
6. Your site will be live at: `https://YOUR_USERNAME.github.io/shreevari-snacks/`

## Step 7: Configure Custom Domain (Optional)

### 7.1 Update DNS Records
In your domain registrar (where you bought shreevarisnacks.in):

Add these A records:
```
Type: A, Name: @, Value: 185.199.108.153
Type: A, Name: @, Value: 185.199.109.153
Type: A, Name: @, Value: 185.199.110.153
Type: A, Name: @, Value: 185.199.111.153
```

Add CNAME record:
```
Type: CNAME, Name: www, Value: YOUR_USERNAME.github.io
```

### 7.2 Configure GitHub Pages
1. In GitHub repository Settings > Pages
2. Under "Custom domain", enter: `shreevarisnacks.in`
3. Click "Save"
4. Wait for DNS to propagate (can take up to 24 hours)
5. Check "Enforce HTTPS" after DNS propagates

## Testing Your Website

### Test User Features
1. Visit your website homepage
2. Click "Menu" - should show categories
3. Click "Contact" - test the contact form
4. Click "Login" - create a test user account
5. Click WhatsApp buttons - should open WhatsApp

### Test Admin Features
1. Go to `/admin-login.html`
2. Login with:
   - Email: admin@shreevarisnacks.in
   - Password: [Your admin password]
   - Security Code: 123456
3. Test adding a menu item
4. Test creating an offer
5. Test editing and deleting

## Troubleshooting

### Firebase not connecting?
- Check that Firebase SDK scripts are added to ALL HTML files
- Verify firebaseConfig values in firebase-config.js
- Check browser console for errors (F12)

### Admin login not working?
- Verify UID in admins collection matches Authentication UID
- Check security code is correct
- Clear browser cache and try again

### Menu items not showing?
- Check Firestore rules are published
- Verify menuItems collection exists
- Check that items have `available: true`

### GitHub Pages not working?
- Wait 2-3 minutes after enabling Pages
- Check repository is Public
- Verify branch is set to "main"

## Next Steps

1. **Add Real Menu Items**: Use admin dashboard to add your actual menu
2. **Customize Content**: Update contact information, about text, etc.
3. **Add Images**: Upload item images to Firebase Storage or use image URLs
4. **Configure WhatsApp**: Update phone number if different
5. **Update Security Code**: Change admin security code to something unique
6. **Backup Regularly**: Use admin dashboard to download backups

## Support

If you need help:
- Check the main README.md for detailed documentation
- Review Firebase Console for errors
- Check browser console (F12) for JavaScript errors
- Verify all steps were completed in order

## Security Checklist

- [ ] Changed default admin security code
- [ ] Set strong admin password
- [ ] Published Firestore security rules
- [ ] Enabled HTTPS on custom domain
- [ ] Removed sample-data.json from public site (keep for reference)

---

**Congratulations!** Your Shreevari Snacks website is now live! 🎉
