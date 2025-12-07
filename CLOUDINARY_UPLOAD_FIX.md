# Cloudinary Upload Error Fix

## ❌ Error Description

```
Failed to upload image: Upload preset must be specified when using unsigned upload
statusCode: 500
```

This error occurs when trying to upload profile images from the camera or gallery.

## 🔍 Root Cause

The error is a **BACKEND ISSUE**, not a frontend problem. The backend server at `https://phrma-production-app-backend-main.onrender.com` is attempting to upload images to Cloudinary without proper configuration.

### Why This Happens

Cloudinary offers two upload methods:

1. **Signed Upload** (Recommended for production)
   - Requires API secret on backend
   - More secure
   - Server signs each upload request

2. **Unsigned Upload** (Simpler but less secure)
   - Requires an "upload preset" configured in Cloudinary dashboard
   - The backend is trying to use this method but hasn't configured the preset

## ✅ Solutions

### Solution 1: Frontend Enhanced Error Handling (Implemented)

I've added intelligent error handling that:

1. **Detects Cloudinary errors** automatically
2. **Offers retry without image** - Allows users to update profile info without the image
3. **Provides clear error messages** to users
4. **Prevents complete failure** - Profile updates can still succeed without image

**User Experience:**
```
1. User takes photo from camera
2. User taps "Update Profile"
3. Backend fails to upload image
4. Frontend shows dialog:
   "Image Upload Failed
    The server is having trouble uploading images.
    Would you like to update your profile without changing the picture?"
   
   [Cancel]  [Update Without Image]
   
5. If user taps "Update Without Image":
   - Profile info (name, email, address, etc.) updates successfully
   - Image remains unchanged
```

### Solution 2: Backend Fix (Required by Backend Developer)

The backend needs to configure Cloudinary properly. Here are the options:

#### Option A: Configure Upload Preset (Easiest)

1. Log into Cloudinary dashboard: https://cloudinary.com/console
2. Go to **Settings** → **Upload** → **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `epharmacy_profiles` (or any name)
   - **Signing mode**: Unsigned
   - **Folder**: `profile_images`
   - Save the preset
5. Update backend code to use this preset:

```javascript
// Backend: In your upload controller
const cloudinary = require('cloudinary').v2;

const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    upload_preset: 'epharmacy_profiles', // Add this line
    folder: 'profile_images',
  });
  return result.secure_url;
};
```

#### Option B: Use Signed Upload (Recommended for Production)

1. Configure Cloudinary with API secret:

```javascript
// Backend: cloudinary.config.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Required for signed uploads
});
```

2. Update upload code:

```javascript
// Backend: No upload_preset needed for signed uploads
const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'profile_images',
    // No upload_preset needed - will use signed upload
  });
  return result.secure_url;
};
```

### Solution 3: Alternative - Direct Frontend Upload (Advanced)

If backend cannot be fixed quickly, upload directly from frontend:

1. Install Cloudinary SDK:
```bash
npm install cloudinary-react-native
```

2. Create upload function:
```typescript
// src/utils/cloudinaryUpload.ts
const uploadToCloudinary = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });
  formData.append('upload_preset', 'epharmacy_profiles'); // Get from Cloudinary
  formData.append('cloud_name', 'your_cloud_name'); // Get from Cloudinary

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url;
};
```

3. Upload before calling API:
```typescript
// In EditProfileScreen.tsx
const handleSubmit = async () => {
  if (formData.profileImage) {
    // Upload to Cloudinary first
    const imageUrl = await uploadToCloudinary(formData.profileImage.uri);
    
    // Send URL to backend instead of file
    const jsonData = {
      name: formData.name,
      email: formData.email,
      profileImageUrl: imageUrl, // Send URL instead of file
    };
    
    await updateUserProfile(jsonData, false);
  }
};
```

## 🧪 Testing the Fix

### Test Scenario 1: Image Upload Working
1. Take photo from camera
2. Tap "Update Profile"
3. If backend is fixed: Profile updates with image ✓

### Test Scenario 2: Image Upload Failing (Current State)
1. Take photo from camera
2. Tap "Update Profile"
3. See error dialog: "Image Upload Failed..."
4. Tap "Update Without Image"
5. Profile updates successfully (without image) ✓

### Test Scenario 3: No Image Change
1. Update only name/email
2. Tap "Update Profile"
3. Profile updates successfully ✓

## 📋 Recommended Action Plan

### For Frontend Developer (You):
- ✅ **Already Done**: Enhanced error handling implemented
- ⏳ **Wait**: For backend team to fix Cloudinary configuration
- 📱 **Test**: Verify the "Update Without Image" fallback works

### For Backend Developer:
- ⚠️ **Priority**: Configure Cloudinary upload preset (5 minutes)
- 🔧 **Steps**: See "Option A: Configure Upload Preset" above
- ✅ **Test**: Upload an image and verify no errors

## 🔗 Backend API Endpoint

The issue is in this endpoint:
```
PUT /api/v1/users/update/profile
```

Backend code location: Look for Cloudinary upload configuration in your user controller.

## 📞 Support

If backend team needs help:
- Cloudinary Docs: https://cloudinary.com/documentation/upload_images
- Upload Presets: https://cloudinary.com/documentation/upload_presets
- React Native Upload: https://cloudinary.com/documentation/react_native_image_upload

## ✅ Current Status

- **Frontend**: ✅ Fixed with enhanced error handling
- **Backend**: ❌ Needs Cloudinary configuration
- **User Impact**: 🟡 Users can still update profiles (without images)
