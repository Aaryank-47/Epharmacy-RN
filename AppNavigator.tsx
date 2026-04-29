
import React, { memo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import type { ComponentType } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "./src/context/AuthContext";

// PUBLIC / AUTH SCREENS
import SignInScreen from "./src/authencation/SignInScreen";
import SignUpScreen from "./src/authencation/SignUpScreen";
import ForgetPasswordScreen from "./src/authencation/ForgetPassword";

// INTRO FLOWS
import WelcomePage from "./src/components/WelcomePage";
import StartPage from "./src/components/StartPage";

// PRIVATE SCREENS
import HomePage from "./src/components/home/HomePage";
import OfferBannerSection from "./src/components/home/screens/OfferBannerSection";
import ProfilePage from "./src/authencation/user/ProfilePage";
import EditProfileScreen from "./src/authencation/user/EditProfileScreen";
import SearchScreen from "./src/components/commonPage/SearchScreen";
import ProductDetail from "./src/components/pages/ProductDetail";
import ShoppingBagScreen from "./src/components/pages/ShoppingBagScreen";
import CheckoutPage from "./src/components/pages/CheckoutPage";
import PaymentScreen from "./src/components/commonPage/PaymentScreen";
import PDFUploadScreen from "./src/components/qr/PDFUploadScreen";
import OCRHistoryScreen from "./src/components/qr/OCRHistoryScreen";
import HistoryPage from "./src/components/commonPage/HistoryPage";
import WishlistScreen from "./src/components/pages/WishlistScreen";
import NotificationsScreen from "./src/components/pages/NotificationsScreen";
import CategoryProductsScreen from "./src/components/pages/category/CategoryProductsScreen";
import EventDetailScreen from "./src/components/pages/EventDetailScreen";
import OfferDetailScreen from "./src/components/pages/OfferDetailScreen";
import BrandDetailScreen from "./src/components/pages/BrandDetailScreen";
import type { Advertisement } from "./src/api/types";

export type RootStackParamList = {
  HomeTabs: undefined;
  ProfilePage: undefined;
  EditProfile: {
    userData?: {
      name: string;
      email: string;
      phone: string;
      age: number | null;
      dob: string | null;
      role: string;
      address: any;
      profileImage: string[];
      wishlistCount: number;
      viewedItemsCount: number;
      itemsPurchasedCount: number;
      lastLogin: string | null;
    };
    refreshProfile?: () => void;
  };
  Search: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  ProductDetail: { productId?: string } | undefined;
  ShoppingBagScreen: undefined;
  CheckoutPage: undefined;
  PaymentScreen: undefined;
  OfferBannerSection: undefined;
  PDFUploadScreen: undefined;
  OCRHistoryScreen: undefined;
  HistoryPage: undefined;
  Wishlist: undefined;
  Notifications: undefined;
  Welcome: undefined;
  Start: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EventDetail: { event: Advertisement };
  OfferDetail: { offer: Advertisement };
  BrandDetail: { brand: Advertisement };
};

type ScreenConfig = {
  name: keyof RootStackParamList;
  component: ComponentType<any>;
};

const Stack = createStackNavigator<RootStackParamList>();

const AUTHENTICATED_SCREENS: ScreenConfig[] = [
  { name: "HomeTabs", component: HomePage },
  { name: "ProfilePage", component: ProfilePage },
  { name: "EditProfile", component: EditProfileScreen },
  { name: "Search", component: SearchScreen },
  { name: "CategoryProducts", component: CategoryProductsScreen },
  { name: "ProductDetail", component: ProductDetail },
  { name: "ShoppingBagScreen", component: ShoppingBagScreen },
  { name: "CheckoutPage", component: CheckoutPage },
  { name: "PaymentScreen", component: PaymentScreen },
  { name: "PDFUploadScreen", component: PDFUploadScreen },
  { name: "OCRHistoryScreen", component: OCRHistoryScreen },
  { name: "HistoryPage", component: HistoryPage },
  { name: "Wishlist", component: WishlistScreen },
  { name: "OfferBannerSection", component: OfferBannerSection },
  { name: "Notifications", component: NotificationsScreen },
  { name: "EventDetail", component: EventDetailScreen },
  { name: "OfferDetail", component: OfferDetailScreen },
  { name: "BrandDetail", component: BrandDetailScreen },
];

const PUBLIC_SCREENS: ScreenConfig[] = [
  { name: "Welcome", component: WelcomePage },
  { name: "Start", component: StartPage },
  { name: "SignIn", component: SignInScreen },
  { name: "SignUp", component: SignUpScreen },
  { name: "ForgotPassword", component: ForgetPasswordScreen },
];

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const screensToRender = isAuthenticated ? AUTHENTICATED_SCREENS : PUBLIC_SCREENS;

  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={isAuthenticated ? "HomeTabs" : "Welcome"}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
        gestureDirection: 'horizontal',
      }}
    >
      {screensToRender.map(({ name, component }) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={{
            animation: name === "SignIn" || name === "SignUp" || name === "ForgotPassword" ? "fade" :
              name === "HomeTabs" || name === "Welcome" ? "fade" :
                "slide_from_right",
          }}
        />
      ))}
    </Stack.Navigator>
  );
};

export default memo(AppNavigator);
