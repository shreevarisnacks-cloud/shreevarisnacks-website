# Shreevari Snacks Website

A complete, feature-rich website for Shreevari Snacks with menu management, admin dashboard, and WhatsApp ordering integration.

## Features

### User Features
- **Home Page**: Beautiful landing page with offers and popular items
- **Menu Page**: Category-wise menu display with filtering
- **Contact Page**: Contact information and form
- **WhatsApp Integration**: Quick order buttons throughout the site
- **User Authentication**: Login/Signup functionality
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop

### Admin Features
- **Secure Admin Login**: Separate admin authentication with security code
- **Menu Management**: Add, edit, and delete menu items
- **Offer Management**: Create and manage promotional offers
- **Category Management**: Organize items by category (Pizza, Burger, Sandwich, etc.)
- **Settings**: Change password and download data backups
- **Activity Logging**: All admin actions are logged

## Technologies Used

- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Fonts**: Google Fonts (Poppins, Playfair Display)
- **Icons**: Emoji and SVG icons

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable the following services:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Storage

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click on the web icon (</>)
   - Copy the configuration object

5. Update `firebase-config.js`:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

6. Add Firebase SDK to your HTML files (add before closing `</body>` tag):
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
   ```

### 2. Firestore Database Structure

Create the following collections in Firestore:

#### Collection: `menuItems`
```javascript
{
  name: "Margherita Pizza",
  category: "pizza",
  description: "Classic pizza with tomato sauce and cheese",
  price: 199,
  image: "https://example.com/image.jpg", // Optional
  available: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### Collection: `offers`
```javascript
{
  title: "Buy 1 Get 1 Free",
  description: "On all pizzas every Wednesday!",
  price: "50% OFF",
  badge: "HOT DEAL",
  active: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### Collection: `admins`
```javascript
{
  // Document ID should be the Firebase Auth UID
  name: "Admin Name",
  email: "admin@shreevarisnacks.in",
  securityCode: "123456", // 6-digit code for extra security
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### Collection: `users`
```javascript
{
  // Document ID should be the Firebase Auth UID
  name: "User Name",
  email: "user@example.com",
  phone: "+91 98445 72129",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### Collection: `contactMessages`
```javascript
{
  name: "Customer Name",
  email: "customer@example.com",
  phone: "+91 98445 72129",
  message: "I love your food!",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

#### Collection: `adminLogs`
```javascript
{
  adminId: "firebase-auth-uid",
  email: "admin@shreevarisnacks.in",
  action: "login", // or "failed_login"
  timestamp: "2024-01-01T00:00:00.000Z",
  ip: "N/A"
}
```

### 3. Firestore Security Rules

Set up these security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Menu Items - Read for all, Write for admins only
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Offers - Read for all, Write for admins only
    match /offers/{offerId} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Admins - Read/Write for admins only
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
    
    // Users - Read/Write for authenticated users (their own data)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contact Messages - Create for all, Read for admins
    match /contactMessages/{messageId} {
      allow create: if true;
      allow read: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Admin Logs - Write for all (for logging), Read for admins
    match /adminLogs/{logId} {
      allow create: if true;
      allow read: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

### 4. Create First Admin Account

1. Go to Firebase Console > Authentication
2. Add a user manually with email and password
3. Copy the UID of this user
4. Go to Firestore > Create a document in `admins` collection:
   - Document ID: [Paste the UID]
   - Fields:
     - `name`: "Your Name"
     - `email`: "your-email@example.com"
     - `securityCode`: "123456" (or your preferred 6-digit code)
     - `createdAt`: Current timestamp

### 5. GitHub Pages Deployment

1. Create a new repository on GitHub
2. Push all files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/shreevari-snacks.git
   git push -u origin main
   ```

3. Go to repository Settings > Pages
4. Under "Source", select "main" branch
5. Click Save
6. Your site will be available at: `https://yourusername.github.io/shreevari-snacks/`

### 6. Custom Domain Setup (shreevarisnacks.in)

1. Go to your domain registrar (where you bought shreevarisnacks.in)
2. Add the following DNS records:
   - Type: A, Name: @, Value: 185.199.108.153
   - Type: A, Name: @, Value: 185.199.109.153
   - Type: A, Name: @, Value: 185.199.110.153
   - Type: A, Name: @, Value: 185.199.111.153
   - Type: CNAME, Name: www, Value: yourusername.github.io

3. In GitHub repository Settings > Pages:
   - Enter your custom domain: shreevarisnacks.in
   - Check "Enforce HTTPS" (after DNS propagates)

4. Create a `CNAME` file in your repository:
   ```
   shreevarisnacks.in
   ```

### 7. WhatsApp Integration

The WhatsApp number is already configured in the code: **+91 98445 72129**

To change it, search and replace this number in:
- `index.html`
- `menu.html`
- `contact.html`

Replace the WhatsApp link format:
```
https://wa.me/c/919844572129
```

## File Structure

```
shreevari-snacks/
├── index.html              # Home page
├── menu.html               # Menu page
├── contact.html            # Contact page
├── login.html              # User login/signup
├── admin-login.html        # Admin login
├── admin-dashboard.html    # Admin dashboard
├── styles.css              # Custom styles
├── firebase-config.js      # Firebase configuration
├── app.js                  # Home page JavaScript
├── menu.js                 # Menu page JavaScript
├── contact.js              # Contact page JavaScript
├── login.js                # Login/signup JavaScript
├── admin-login.js          # Admin login JavaScript
├── admin-dashboard.js      # Admin dashboard JavaScript
├── CNAME                   # Custom domain file
└── README.md               # This file
```

## Categories Available

- Pizza 🍕
- Burger 🍔
- Sandwich 🥪
- Milkshake 🥤
- Mocktail 🍹
- Maggie 🍜
- More 🍽️

## Admin Dashboard Features

### Menu Management
- Add new menu items with name, category, description, price, and image
- Edit existing items
- Delete items
- Filter items by category
- Toggle item availability

### Offers Management
- Create promotional offers
- Set offer title, description, discount/price
- Add custom badge (e.g., "HOT DEAL", "LIMITED TIME")
- Activate/deactivate offers
- Edit and delete offers

### Settings
- Change admin password
- Download database backup (JSON format)

## Security Features

- **Email/Password Authentication**: Secure user registration and login
- **Admin Verification**: Extra security code required for admin access
- **Activity Logging**: All admin login attempts are logged
- **Firestore Security Rules**: Database access restricted by authentication
- **Password Requirements**: Minimum 6 characters

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Support

For issues or questions, contact:
- Email: info@shreevarisnacks.in
- Phone: +91 98445 72129
- WhatsApp: https://wa.me/c/919844572129

## License

© 2024 Shreevari Snacks. All rights reserved.
