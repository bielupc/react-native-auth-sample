import { OAuthProvider, useGuestAuth, useOAuth } from "@openfort/react-native";
import { Button, Text, View } from "react-native";

export default function LoginScreen() {
  const { signUpGuest } = useGuestAuth()
  const { initOAuth, error } = useOAuth();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 10,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Openfort Expo Example</Text>
      {/* <Text style={{ fontSize: 10 }}>{Application.applicationId}</Text>
      <Text style={{ fontSize: 10 }}>
        {Application.applicationId === "host.exp.Exponent"
          ? "exp"
          : Constants.expoConfig?.scheme}
      </Text> */}

      <Button
        title="Login as Guest"
        onPress={() =>
          signUpGuest()
        }
      />

      <View
        style={{ display: "flex", flexDirection: "column", gap: 5, margin: 10 }}
      >
        {["twitter", "google", "discord", "apple"].map((provider) => (
          <View key={provider}>
            <Button
              title={`Login with ${provider}`}
              onPress={async () => {
                try {
                  await initOAuth({ provider: provider as OAuthProvider })
                } catch (error) {
                  console.error("Error logging in with OAuth:", error);
                }
              }
              }
            ></Button>
          </View>
        ))}
      </View>
      {error && <Text style={{ color: "red" }}>Error: {error.message}</Text>}
    </View>
  );
}
