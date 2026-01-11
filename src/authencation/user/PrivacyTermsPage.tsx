import React from "react";
import { Text, ScrollView } from "react-native";

interface Props {
  isDark?: boolean;
}

const PrivacyTermsPage: React.FC<Props> = ({ isDark = false }) => {
  const textColor = isDark ? "text-white" : "text-gray-800";
  const headerColor = isDark ? "text-white" : "text-black";

  return (
    <ScrollView className={`flex-1 px-5 py-6 ${isDark ? "bg-black" : "bg-white"}`}>
      
      {/* Header 1 */}
      <Text className={`text-xl font-semibold mb-2 ${headerColor}`}>
        Privacy Policy
      </Text>

      <Text className={`text-base leading-6 mb-4 ${textColor}`}>
        We value your privacy and ensure that your personal data is handled securely.
        This section explains how your information is collected and used in our app.
      </Text>

      {/* Header 2 */}
      <Text className={`text-xl font-semibold mb-2 ${headerColor}`}>
        Terms of Service
      </Text>

      <Text className={`text-base leading-6 mb-4 ${textColor}`}>
        By using our app, you agree to follow our guidelines and usage terms. 
        Please read the terms carefully before continuing.
      </Text>

      {/* Header 3 */}
      <Text className={`text-xl font-semibold mb-2 ${headerColor}`}>
        About Us
      </Text>

      <Text className={`text-base leading-6 mb-4 ${textColor}`}>
        We are committed to delivering the best experience for our users and 
        constantly improving our platform with new features.
      </Text>
    </ScrollView>
  );
};

export default PrivacyTermsPage;
