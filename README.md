#  E-Pharmacy RN

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![React Native](https://img.shields.io/badge/React_Native-v0.76+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-blue) ![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-Enabled-purple)

A production-grade, feature-rich **E-Commerce Pharmacy Application** built with **React Native** and **TypeScript**. This project demonstrates modern mobile development practices, including advanced animations, state management, and seamless native integration.

---

##  Key Features

###  Product Discovery & Shopping
-   **Dynamic Category Listings**: Filterable and sortable product grids with smooth layout animations.
-   **Smart Search**: Real-time search with animated filter bars and recent search tracking.
-   **Advanced Filtering**: 
    -   Combined Horizontal Filter Bar (Sort, Free Delivery, Discounts).
    -   **Price Range Slider** (`₹2 - ₹10,000`) using dual-thumb gesture controls.
    -   Top Stores quick-access carousel.
-   **Product Details**: High-performance image carousel, detailed descriptions, and rating breakdowns.
-   **Wishlist & Cart**: Persistent local management of user favorites and shopping bag.

### 🚀 Social & Sharing
-   **One-Tap Sharing**: Share product images *and* professionally formatted text details directly to WhatsApp, Instagram, Telegram, and more.
-   **Smart Fallbacks**: Automaticaly handles image download failures by switching to text-only mode.
-   **Interactive Share Overlay**: Custom animated overlay UI for platform selection.

###  Authentication & Profile
-   **Secure Auth Flow**: Sign Up/Login with validation.
-   **Profile Management**: Edit profile details, manage addresses.

###  UI/UX Excellence
-   **NativeWind (TailwindCSS)**: modern, utility-first styling for rapid UI development.
-   **Dark Mode Support**: Fully theme-aware components (Light/Dark auto-detection).
-   **Smooth Animations**: Powered by `react-native-reanimated` and `LayoutAnimation`.
-   **Gesture Handling**: Smooth modal dismissals (`PanResponder`) and swipe actions.

---

##  Tech Stack

### Core
-   **Framework**: [React Native](https://reactnative.dev/) (v0.82+)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Navigation**: [React Navigation v7](https://reactnavigation.org/) (Stack & Native Stack)
-   **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + Context API

### Styling & UI
-   **Styling**: [NativeWind](https://www.nativewind.dev/) (TailwindCSS for RN)
-   **Icons**: [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) (Ionicons)
-   **Animations**: `react-native-reanimated` & `LayoutAnimation`
-   **Components**: Custom modular components (`ProductCard`, `FilterModal`, `FilterBar`, `SearchHeader`)

### Native Modules & Integration
-   **Sharing**: [`react-native-share`](https://github.com/react-native-share/react-native-share)
-   **File System**: [`react-native-fs`](https://github.com/itinance/react-native-fs) (Image downloading for share)
-   **Sliders**: `@ptomasroos/react-native-multi-slider`
-   **Safe Area**: `react-native-safe-area-context`

---

## 📂 Project Structure

```bash
src/
├── api/             # API definition and Types (Axios)
├── authentication/  # Auth Screens (Login, SignUp)
├── components/      # Reusable UI Components
│   ├── commonPage/  # Shared widgets (Search, Cards, Modals)
│   ├── home/        # Home screen widgets
│   ├── pages/       # Full screen views (CategoryProducts, Wishlist)
│   └── modals/      # Global modals
├── context/         # React Context (Cart, Wishlist)
├── hooks/           # Custom Hooks (useProductShare, useThemePalette)
├── navigation/      # AppNavigator and Route definitions
└── redux/           # Global Store config
```

---

##  Getting Started

### Prerequisites
-   Node.js (>= 18)
-   JDK 17
-   Android Studio (for Android) or Xcode (for iOS)
-   React Native CLI

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Aaryank-47/Epharmacy-RN.git
    cd Epharmacy-RN
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **iOS Setup (Mac Only)**
    ```bash
    cd ios
    pod install
    cd ..
    ```

### Running the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Start Metro Bundler (if not started automatically):**
```bash
npm start
```

---

##  Contributing

Contributions are welcome! Please follow "Industry Standard" coding practices:
1.  **Modular Components**: Keep components small and focused (e.g., `ProductCard.tsx` vs `ProductList.tsx`).
2.  **Hooks**: Extract logic into custom hooks (e.g., `useProductShare`).
3.  **Types**: Always define interfaces for Props and State.
4.  **Styling**: Use NativeWind classes for consistency.

---

## 📄 License

This project is licensed under the MIT License.
