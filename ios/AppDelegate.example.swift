// iOS AppDelegate.swift Configuration for Firebase Cloud Messaging
// File: ios/EPharmacyNative/AppDelegate.swift

import UIKit
import Firebase  // Add this import

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  var window: UIWindow?
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    
    // Initialize Firebase - Add this line
    FirebaseApp.configure()
    
    // Your existing code...
    
    return true
  }
  
  // Optional: Handle remote notifications (for advanced use cases)
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // This is handled by react-native-firebase automatically
    // No need to add code here unless you have custom requirements
  }
  
  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
  }
}
