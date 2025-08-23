import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo,{addEventListener} from "@react-native-community/netinfo";

import { useTheme } from "../theme/ThemeContext";
import { NavigationProp, ParamListBase } from "@react-navigation/native";

const Header = ({ text, navigation }: { text: string; navigation: any }) => {
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const { theme } = useTheme();

  useEffect(() => {
    // Start continuous rotation animation
const unsubscribee = addEventListener(state => {
  console.log("Connection type", state.type);
  console.log("Is connected?", state.isConnected);
});

    // Set up network monitoring
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("🚀 ~ Header ~ state:", state);
      console.log("Network state changed:", state.isConnected);
      setIsConnected(state.isConnected ?? false);

      if (!state.isConnected) {
        setShowNetworkBanner(true);
      } else if (showNetworkBanner) {
        // Connection restored
        setShowNetworkBanner(false);
        // Refresh jobs if we have a valid token
      }
    });

    return () => unsubscribe();
  }, [showNetworkBanner]);
  return (
    <React.Fragment>
      {showNetworkBanner && (
        <View style={styles.networkBanner}>
          <Text style={styles.networkBannerText}>
            ⚠️ No Internet Connection
          </Text>
        </View>
      )}

      {/* Header with SafeArea */}
      <SafeAreaView
        style={[
          styles.headerSafeArea,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <View style={[styles.header]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.openDrawer()}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.greeting}>{text}</Text>
          </View>
        </View>
      </SafeAreaView>
    </React.Fragment>
  );
};
const styles = StyleSheet.create({
  // Network banner styles
  networkBanner: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    zIndex:999
  },
  networkBannerText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  headerSafeArea: {
    backgroundColor: "#45BBA5",
    height: Dimensions.get("window").height * (Platform.OS === 'ios' ? 0.15 : 0.12),
  },
  header: {
    paddingTop: Platform?.OS === "ios" ? 5 : 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  greeting: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default Header;
