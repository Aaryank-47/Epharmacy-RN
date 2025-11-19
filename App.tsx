import React, { useEffect } from "react";
import { StatusBar, useColorScheme, Platform } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import CheckoutPage from "./components/User/pages/CheckoutPage";
import SignInScreen from "./components/User/Authntiocation/SignInScreen";
import SignUpScreen from "./components/User/Authntiocation/SignUpScreen";
import EditProfileScreen from "./components/User/pages/EditProfileScreen";
import StartPage from "./components/StartPage";
import WelcomePage from "./components/welcomePage";
import HomePage from "./components/User/Home/Home";
import ForgetPasswordScreen from "./components/User/Authntiocation/ForgetPasswordScreen";
import ProfilePage from "./components/User/pages/ProfilePage";
import SearchScreen from "./components/User/pages/SearchScreen";
import ProductDetail from "./components/User/pages/ProductDetail";
import ShoppingBagScreen from "./components/User/pages/ShoppingBagScreen";
import PaymentScreen from "./components/User/pages/PaymentScreen";

import { AuthProvider, useAuth } from "./components/context/AuthContext";
import { CartProvider } from "./components/User/pages/CartContext";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator initialRouteName={isAuthenticated ? "HomeTabs" : "Welcome"}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="HomeTabs"
            component={HomePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfilePage"
            component={ProfilePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetail}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CheckoutPage"
            component={CheckoutPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShoppingBagScreen"
            component={ShoppingBagScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentScreen"
            component={PaymentScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomePage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Start"
            component={StartPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgetPasswordScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

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
