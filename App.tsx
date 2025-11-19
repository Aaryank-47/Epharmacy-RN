import React, { useEffect } from "react";
import { StatusBar, useColorScheme, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import CheckoutPage from "./src/components/pages/CheckoutPage";
import SignInScreen from "./src/authencation/SignInScreen";
import SignUpScreen from "./src/authencation/SignUpScreen";
import EditProfileScreen from "./src/authencation/user/EditProfileScreen";
import StartPage from './src/components/StartPage';
import WelcomePage from "./src/components/WelcomePage";
import HomePage from "./src/components/home/HomePage";
import ForgetPasswordScreen from "./src/authencation/ForgetPassword";
import ProfilePage from "./src/authencation/user/ProfilePage";
import SearchScreen from "./src/components/commonPage/SearchScreen";
import ProductDetail from "./src/components/pages/ProductDetail";
import ShoppingBagScreen from "./src/components/pages/ShoppingBagScreen";
import PaymentScreen from "./src/components/commonPage/PaymentScreen";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";

type RootStackParamList = {
  HomeTabs: undefined;
  ProfilePage: undefined;
  EditProfile: undefined;
  Search: undefined;
  ProductDetail: undefined;
  CheckoutPage: undefined;
  ShoppingBagScreen: undefined;
  PaymentScreen: undefined;
  Welcome: undefined;
  Start: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const authenticated = isAuthenticated();

  return (
    <Stack.Navigator 
      initialRouteName={authenticated ? "HomeTabs" : "Welcome"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeTabs" component={HomePage} />
      <Stack.Screen name="ProfilePage" component={ProfilePage} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="CheckoutPage" component={CheckoutPage} />
      <Stack.Screen name="ShoppingBagScreen" component={ShoppingBagScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="Welcome" component={WelcomePage} />
      <Stack.Screen name="Start" component={StartPage} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgetPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      SplashScreen.hide();
    }
  }, []);

  const colorScheme = useColorScheme();
  const barStyle = colorScheme === "dark" ? "light-content" : "dark-content";

  return (
    <CartProvider>
      <AuthProvider>
        <StatusBar
          barStyle={barStyle}
          backgroundColor={colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF"}
          translucent={Platform.OS === "android"}
        />

        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </CartProvider>
  );
}
