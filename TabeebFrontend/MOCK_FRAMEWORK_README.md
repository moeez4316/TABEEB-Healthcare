# 🎭 Mock Backend Framework - TABEEB Doctor Dashboard

## Overview
This mock framework allows you to test the complete doctor dashboard experience without a backend, while keeping the code ready for easy backend integration.

## 🚀 Quick Start

### Current Configuration
- **Mock Mode**: `ENABLED` ✅
- **Auto-loads**: Empty profile (realistic new doctor experience)
- **Dev Panel**: Available in bottom-right corner

### Testing Flow
1. **Verification**: Submit verification form → Auto-pending status
2. **Profile**: Edit profile information → Saved to localStorage
3. **Dashboard**: View statistics and completion percentage
4. **Mock Admin**: Use dev panel to approve/reject verification

## 🎛️ Configuration

### Enable/Disable Mock Mode
```typescript
// In src/lib/config/appConfig.ts
export const APP_CONFIG = {
  USE_MOCK_BACKEND: true, // Set to false for real backend
  // ... other settings
}
```

### URL Parameters
- `?mock=false` - Disable mock mode for this session
- `?mock=true` - Enable mock mode for this session  
- `?seed=true` - Load sample doctor data automatically

## 🔧 Mock Development Panel

Click the purple settings icon (⚙️) in the bottom-right corner:

### Quick Actions
- **Load Sample Data**: Pre-fills profile with realistic doctor data
- **Clear All Data**: Resets to empty state
- **Approve Verification**: Simulates admin approval
- **Reject Verification**: Simulates admin rejection

## 📊 Features Included

### ✅ Fully Mocked
- **Profile Management**: Save/load doctor profiles
- **Image Upload**: Mock image URLs
- **Verification Flow**: Submit → Pending → Approved/Rejected
- **Statistics**: Realistic patient counts, ratings, etc.
- **Profile Completion**: Real-time percentage tracking

### 🔄 Easy Backend Integration
All mock calls mirror real API structure:
```typescript
// Mock: mockDoctorService.loadDoctorProfile(token)
// Real: fetch('/api/doctor', { headers: { Authorization: token }})
```

## 🎯 Testing Scenarios

### New Doctor Registration
1. Start with empty profile (0% completion)
2. Fill out verification form
3. Submit → Status becomes "pending"
4. Use dev panel to approve
5. Complete profile information
6. View dashboard with statistics

### Experienced Doctor
1. Use "Load Sample Data" in dev panel
2. Instantly get 95%+ profile completion
3. Test profile edit modal
4. View realistic statistics and ratings

## 📁 File Structure

```
src/
├── lib/
│   ├── config/
│   │   └── appConfig.ts          # Mock/Real backend toggle
│   ├── mock/
│   │   └── mockDoctorService.ts  # All mock implementations
│   └── doctor-profile-completion.ts
├── store/slices/
│   └── doctorSlice.ts           # Auto-detects mock vs real
├── components/dev/
│   └── MockDevPanel.tsx         # Development helper panel
└── app/Doctor/Dashboard/
    └── page.tsx                 # Main dashboard
```

## 🔄 Backend Integration Guide

### When Backend is Ready

1. **Update Configuration**:
   ```typescript
   // appConfig.ts
   USE_MOCK_BACKEND: false
   ```

2. **Verify API Endpoints**:
   - `GET /api/doctor` - Load profile
   - `PUT /api/doctor` - Save profile  
   - `POST /api/doctor/profile-image` - Upload image
   - `PUT /api/doctor/verification-status` - Update verification

3. **Test Integration**:
   - URL parameter `?mock=false` for testing
   - Compare mock vs real behavior
   - Ensure data structures match

### API Compatibility
The mock service mimics the expected backend API structure:
- Same function signatures
- Same response formats
- Same error handling patterns
- Same async/await patterns

## 🐛 Development Features

### Console Logging
All mock operations are logged with 🎭 emoji:
```
🎭 [MOCK] Loading doctor profile...
🎭 [MOCK] Saving doctor profile...
🎭 [MOCK] Admin action: approve
```

### Realistic Delays
- Profile load: 500ms
- Profile save: 800ms
- Image upload: 1000ms
- Verification: 1500ms

### Error Simulation
- 10% chance of random errors (configurable)
- Network timeout simulation
- Validation error examples

## 🎨 UI/UX Testing

### Profile Completion
- Real-time percentage updates
- Category-based completion tracking
- Next steps recommendations
- Visual progress indicators

### Professional Design
- Pakistani medical specializations
- CNIC formatting
- Province dropdowns
- Professional color scheme
- Responsive design

## ✨ Ready for Production

When backend is ready:
1. Change one config flag
2. No code changes needed
3. Same Redux actions work
4. Same components work
5. Same user experience

The mock framework is designed to be **invisible** to the user experience while providing **powerful** development and testing capabilities! 🚀