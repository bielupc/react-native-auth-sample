import { OAuthProvider, useGuestAuth, useOAuth, useOpenfort } from "@openfort/react-native";
import { Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { signUpGuest } = useGuestAuth()
  const { initOAuth, error } = useOAuth();
  const { logout } = useOpenfort();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        backgroundColor: '#0f0f23',
        padding: 20
      }}
    >
      <View style={{
        alignItems: 'center',
        marginBottom: 40
      }}>
        {/* Replace with actual logo image */}
        <View style={{
          width: 100,
          height: 100,
          backgroundColor: '#00ff9d',
          borderRadius: 50,
          marginBottom: 20
        }} />
        <Text style={{ 
          fontSize: 32,
          fontWeight: "bold",
          color: '#ffffff',
          marginBottom: 10
        }}>
          Openfort
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#808080'
        }}>
          Secure Trading Platform
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#00ff9d',
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 25,
          width: '100%'
        }}
        onPress={() => signUpGuest()}
      >
        <Text style={{
          color: '#0f0f23',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Login as Guest
        </Text>
      </TouchableOpacity>

      <View
        style={{
          width: '100%',
          gap: 12,
          marginTop: 20
        }}
      >
        {["twitter", "google", "discord", "apple"].map((provider) => (
          <TouchableOpacity
            key={provider}
            style={{
              backgroundColor: '#1a1a2e',
              paddingVertical: 12,
              paddingHorizontal: 30,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: '#00ff9d'
            }}
            onPress={async () => {
              try {
                await initOAuth({ provider: provider as OAuthProvider })
              } catch (error) {
                console.error("Error logging in with OAuth:", error);
              }
            }}
          >
            <Text style={{
              color: '#00ff9d',
              fontSize: 16,
              fontWeight: '500',
              textAlign: 'center'
            }}>
              Login with {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#ff4444',
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 25,
          width: '100%',
          marginTop: 20
        }}
        onPress={() => logout()}
      >
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Logout
        </Text>
      </TouchableOpacity>
      
      {error && <Text style={{ color: "#ff4444" }}>Error: {error.message}</Text>}
    </View>
  );
}
