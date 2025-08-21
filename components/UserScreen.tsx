import { useOAuth, useOpenfort, UserWallet, useUser, useWallets } from "@openfort/react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

export const UserScreen = () => {
  const [chainId, setChainId] = useState("84532");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<number, string | string[]> | null>(null);

  // const { signOut } = useSignOut();
  const { user } = useUser();
  const { isReady, error, logout: signOut } = useOpenfort();
  console.log('isReady', isReady)
  console.log('error', error)
  const { linkOauth, isLoading: isOAuthLoading } = useOAuth();

  const { wallets, setActiveWallet, createWallet, activeWallet, isCreating } = useWallets();

  useEffect(() => {
    loadOnboardingAnswers();
  }, []);

  const loadOnboardingAnswers = async () => {
    try {
      const answers = await AsyncStorage.getItem('onboardingAnswers');
      if (answers) {
        setOnboardingAnswers(JSON.parse(answers));
      }
    } catch (error) {
      console.error('Error loading onboarding answers:', error);
    }
  };

  // console.log("Embedded Wallets:", wallets, "Status:", status);

  const signMessage = useCallback(
    async () => {
      try {
        if (!activeWallet) {
          alert("No active wallet selected");
          return;
        }
        console.log("Signing message with wallet:", activeWallet);
        const provider = await activeWallet.getProvider();
        console.log("Provider:", provider);
        const message = await provider.request({
          method: "personal_sign",
          params: [`0x0${Date.now()}`, activeWallet?.address],
        });
        console.log("Message signed:", message);
        if (message) {
          alert("Message signed successfully: " + message);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [activeWallet]
  );

  const switchChain = useCallback(
    async (wallet: UserWallet, id: string) => {
      try {
        setIsSwitchingChain(true);
        console.log("Signing message with wallet:", wallet);
        const provider = await wallet.getProvider();
        console.log("Provider:", provider);
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + Number(id).toString(16) }],
        });
        alert(`Chain switched to ${id} successfully`);
      } catch (e) {
        console.error(e);
      }
      setIsSwitchingChain(false);
    },
    []
  );

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Onboarding Answers Section */}
      {onboardingAnswers && (
        <View style={styles.onboardingSection}>
          <Text style={styles.sectionTitle}>Your Trading Profile</Text>
          <View style={styles.answersContainer}>
            {Object.entries(onboardingAnswers).map(([questionId, answer]) => {
              const questionNumber = parseInt(questionId);
              const question = getQuestionText(questionNumber);
              return (
                <View key={questionId} style={styles.answerItem}>
                  <Text style={styles.questionText}>{question}</Text>
                  <Text style={styles.answerText}>
                    {Array.isArray(answer) ? answer.join(', ') : answer}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.walletSection}>
        <View style={styles.walletContent}>
          <View>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{user.id}</Text>
          </View>

          <View>
            {activeWallet?.address && (
              <>
                <Text style={styles.label}>Current Wallet</Text>
                <Text style={styles.value}>{activeWallet?.address || "disconnected"}</Text>
              </>
            )}

            <Text style={styles.sectionSubtitle}>Available Wallets</Text>
            {
              wallets
                .map((w, i) => (
                  <View key={w.address + i} style={styles.walletItem}>
                    <Button
                      title={`${w.address.slice(0, 6)}...${w.address.slice(-4)}`}
                      disabled={activeWallet?.address === w.address}
                      onPress={() => setActiveWallet({
                        address: w.address,
                        chainId: Number(chainId),
                        onSuccess: () => {
                          alert("Active wallet set to: " + w.address);
                        },
                        onError: (error) => {
                          alert("Error setting active wallet: " + error.message);
                        }
                      })}
                    />

                    {
                      w.isConnecting && (
                        <Text style={styles.connectingText}>
                          Connecting...
                        </Text>
                      )
                    }
                  </View>
                ))
            }
            <Button
              title={isCreating ? "Creating Wallet..." : "Create Wallet"}
              disabled={isCreating}
              onPress={() => createWallet({
                onError: (error) => {
                  alert("Error creating wallet: " + error.message);
                },
                onSuccess: ({ wallet }) => {
                  alert("Wallet created successfully: " + wallet?.address);
                },
              })} />

            <>
              <Text style={styles.value}>Chain ID: {isSwitchingChain ? "Switching..." : chainId}</Text>
              <Button
                title={`Switch to ${chainId === "11155111" ? "84532" : "11155111"}`}
                onPress={async () => {
                  const chainToSwitch = chainId === "11155111" ? "84532" : "11155111";
                  activeWallet && switchChain(activeWallet, chainToSwitch)
                  setChainId(chainToSwitch)
                }}
              />
            </>
          </View>

          <Button title="Logout" onPress={signOut} />
          <Button 
            title="Reset Onboarding" 
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('onboardingAnswers');
                await AsyncStorage.removeItem('onboardingCompleted');
                setOnboardingAnswers(null);
                alert('Onboarding reset successfully! Please restart the app to see the onboarding again.');
              } catch (error) {
                console.error('Error resetting onboarding:', error);
                alert('Failed to reset onboarding');
              }
            }}
            color="#ff8800"
          />
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to get question text based on question ID
const getQuestionText = (questionId: number): string => {
  const questions = {
    1: "Trading Experience Level",
    2: "Primary Investment Goal",
    3: "Daily Trading Time",
    4: "Risk Tolerance",
    5: "Preferred Trading Strategies",
    6: "Preferred Trading Market"
  };
  return questions[questionId as keyof typeof questions] || `Question ${questionId}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  onboardingSection: {
    backgroundColor: '#1a1a2e',
    margin: 10,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  answersContainer: {
    gap: 15,
  },
  answerItem: {
    backgroundColor: '#2a2a3e',
    padding: 15,
    borderRadius: 8,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00ff9d',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 14,
    color: '#ffffff',
  },
  content: {
    display: "flex",
    flexDirection: "column",
    margin: 10,
  },
  walletSection: {
    borderColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    margin: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
  },
  walletContent: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: {
    fontWeight: "bold",
    color: '#ffffff',
    fontSize: 16,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontWeight: "bold",
    marginTop: 20,
    fontSize: 16,
    color: '#ffffff',
  },
  walletItem: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  connectingText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontStyle: "italic",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
});
