import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";

let fontsLoaded = false;

const loadIconFonts = (): void => {
  if (fontsLoaded) {
    return;
  }

  try {
    MaterialIcons.loadFont?.();
    Ionicons.loadFont?.();
    fontsLoaded = true;
  } catch (error) {
    console.warn("Failed to load icon fonts", error);
  }
};

export default loadIconFonts;
