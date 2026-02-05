# Cloudinary Integration Setup Guide

## Why Cloudinary Instead of Firebase Storage?

Cloudinary offers:
- **Free tier**: 25GB storage, 25GB bandwidth/month
- **Image optimization**: Automatic format conversion, compression
- **No server required**: Direct browser uploads
- **CDN delivery**: Fast image loading worldwide
- **Easier setup**: No Firebase Storage rules needed

## Step 1: Create Cloudinary Account (5 minutes)

1. Go to https://cloudinary.com/users/register/free
2. Sign up with your email (or use Google/GitHub)
3. Verify your email
4. Login to Cloudinary Dashboard

## Step 2: Get Your Credentials (2 minutes)

1. In Cloudinary Dashboard, you'll see:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** 
   - **API Secret**

2. **IMPORTANT**: Copy your **Cloud Name** - you'll need it

## Step 3: Create Upload Preset (3 minutes)

An upload preset allows **unsigned uploads** (uploads without API secret):

1. In Cloudinary Dashboard, go to **Settings** (gear icon)
2. Click **Upload** tab
3. Scroll to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Signing Mode**: Select **Unsigned**
   - **Preset name**: `shreevari-snacks-upload` (or any name you like)
   - **Folder**: `shreevari-snacks` (optional, helps organize)
   - **Allowed formats**: `jpg, png, webp, gif`
   - Leave other settings as default
6. Click **Save**
7. **COPY THE PRESET NAME** - you'll need it

## Step 4: Update Your firebase-config.js (2 minutes)

Open `firebase-config.js` and find the Cloudinary section:

```javascript
// Cloudinary Configuration
const cloudinaryConfig = {
  cloudName: "YOUR_CLOUD_NAME",  // Replace with your Cloud Name
  uploadPreset: "YOUR_UPLOAD_PRESET"  // Replace with your preset name
};
```

Replace:
- `YOUR_CLOUD_NAME` with your actual Cloud Name (e.g., `dxyz123abc`)
- `YOUR_UPLOAD_PRESET` with your preset name (e.g., `shreevari-snacks-upload`)

**Example:**
```javascript
const cloudinaryConfig = {
  cloudName: "dxyz123abc",
  uploadPreset: "shreevari-snacks-upload"
};
```

## Step 5: How to Use Cloudinary in Admin Dashboard

### Option 1: Upload from Local Computer (Recommended)

The admin dashboard now has a file upload button. To upload an image:

1. Go to Admin Dashboard > Menu Management
2. Click "Upload Image" button (new feature)
3. Select image from your computer
4. Wait for upload to complete
5. Image URL will be automatically filled

### Option 2: Use Direct URL

You can also paste image URLs directly:
- Upload images to Cloudinary manually
- Use the image URL from Cloudinary
- Paste it in the "Image URL" field

## Step 6: Test the Integration (2 minutes)

1. Go to your Admin Dashboard
2. Try adding a menu item with image upload
3. Check if:
   - Upload button appears
   - Upload progress shows
   - Image URL is filled after upload
   - Item is created with image

## Cloudinary Features Available

### Automatic Optimization
Images are automatically:
- Compressed for smaller file size
- Converted to best format (WebP for modern browsers)
- Served via CDN for fast loading

### Image Transformations
You can transform images in URLs:
```
Original: https://res.cloudinary.com/yourcloud/image/upload/v123/image.jpg

Resized: https://res.cloudinary.com/yourcloud/image/upload/w_800/v123/image.jpg
Quality: https://res.cloudinary.com/yourcloud/image/upload/q_auto/v123/image.jpg
Format: https://res.cloudinary.com/yourcloud/image/upload/f_auto/v123/image.jpg

Combined: https://res.cloudinary.com/yourcloud/image/upload/w_800,q_auto,f_auto/v123/image.jpg
```

## Troubleshooting

### Upload Failing?
1. Check Cloud Name is correct
2. Verify Upload Preset is **Unsigned**
3. Check preset name matches exactly
4. Ensure image is under 10MB
5. Check browser console for errors

### Images Not Showing?
1. Verify URL is correct
2. Check image is in allowed formats (jpg, png, webp, gif)
3. Try opening URL directly in browser
4. Check Cloudinary dashboard for uploaded images

### "Cloudinary not configured" Error?
1. Open `firebase-config.js`
2. Make sure you replaced `YOUR_CLOUD_NAME` with actual value
3. Make sure you replaced `YOUR_UPLOAD_PRESET` with actual value
4. Refresh the page after making changes

## Free Tier Limits

Cloudinary Free Plan includes:
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **Images**: Unlimited number

**This is more than enough for most small businesses!**

If you exceed limits:
- Upgrade to paid plan ($89/month)
- Or use multiple free accounts
- Or optimize/delete old images

## Alternative Image Hosting Options

If you don't want to use Cloudinary, you can use:

1. **ImgBB** (https://imgbb.com) - Free, easy upload
2. **Imgur** (https://imgur.com) - Free, popular
3. **Firebase Storage** - Already included, but requires setup
4. **Direct URLs** - Host on your own server

Just paste the image URLs in the admin dashboard!

## Security Notes

- Upload preset is unsigned - anyone with the preset can upload
- To restrict: Use signed uploads (requires backend)
- Folder structure helps organize images
- Delete unused images to save space
- Monitor usage in Cloudinary dashboard

## Need Help?

- Cloudinary Docs: https://cloudinary.com/documentation
- Support: support@cloudinary.com
- Community: https://community.cloudinary.com

---

**That's it!** You now have free, fast, optimized image hosting for your restaurant! 🎉
