import { useOAuth, useOpenfort, useUser, useWallets } from "@openfort/react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Chart from "./Chart";

export const UserScreen = () => {
  const [chainId, setChainId] = useState("84532");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<number, string | string[]> | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradingOperations, setTradingOperations] = useState<Array<{
    id: number;
    type: 'buy' | 'sell';
    symbol: string;
    price: number;
    quantity: number;
    timestamp: Date;
    pnl?: number;
  }>>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [tradingTimeLeft, setTradingTimeLeft] = useState(10);

  // const { signOut } = useSignOut();
  const { user } = useUser();
  const { isReady, error, logout: signOut } = useOpenfort();
  console.log('isReady', isReady)
  console.log('error', error)
  const { linkOauth, isLoading: isOAuthLoading } = useOAuth();

  const handleLogout = async () => {
    try {
      // Clear onboarding answers from AsyncStorage
      await AsyncStorage.removeItem('onboardingAnswers');
      setOnboardingAnswers(null);
      // Sign out from Openfort
      signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still try to sign out even if clearing storage fails
      signOut();
    }
  };

  const { wallets, setActiveWallet, createWallet, activeWallet, isCreating } = useWallets();

  useEffect(() => {
    loadOnboardingAnswers();
    
    // Cleanup function to clear intervals when component unmounts
    return () => {
      if (tradingIntervals) {
        clearInterval(tradingIntervals.countdownInterval);
        clearInterval(tradingIntervals.tradingInterval);
      }
    };
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

  const toggleTrading = () => {
    if (!isTrading) {
      // Start trading simulation
      startTradingSimulation();
    } else {
      // Stop trading simulation
      stopTradingSimulation();
    }
    setIsTrading(!isTrading);
  };

  const startTradingSimulation = () => {
    setTradingOperations([]);
    setTotalPnL(0);
    setTradingTimeLeft(10);
    
    // Start the 10-second countdown
    const countdownInterval = setInterval(() => {
      setTradingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsTrading(false);
          return 0;
        }
        return prev - 1;
      });
    }, 100000);

    // Generate trading operations every 1-2 seconds
    const tradingInterval = setInterval(() => {
      generateTradingOperation();
    }, Math.random() * 1000 + 1000); // Random interval between 1-2 seconds

    // Store intervals for cleanup
    setTradingIntervals({ countdownInterval, tradingInterval });
  };

  const stopTradingSimulation = () => {
    if (tradingIntervals) {
      clearInterval(tradingIntervals.countdownInterval);
      clearInterval(tradingIntervals.tradingInterval);
      setTradingIntervals(null);
    }
    setTradingTimeLeft(0);
  };

  const generateTradingOperation = () => {
    const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI', 'MATIC'];
    const types: ('buy' | 'sell')[] = ['buy', 'sell'];
    
    const newOperation: {
      id: number;
      type: 'buy' | 'sell';
      symbol: string;
      price: number;
      quantity: number;
      timestamp: Date;
      pnl?: number;
    } = {
      id: Date.now(),
      type: types[Math.floor(Math.random() * types.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      price: parseFloat((Math.random() * 50000 + 1000).toFixed(2)),
      quantity: parseFloat((Math.random() * 10 + 0.1).toFixed(4)),
      timestamp: new Date(),
    };

    // Calculate PnL for sell operations
    if (newOperation.type === 'sell') {
      const buyPrice = parseFloat((Math.random() * 40000 + 1000).toFixed(2));
      const pnl = (newOperation.price - buyPrice) * newOperation.quantity;
      newOperation.pnl = parseFloat(pnl.toFixed(2));
      setTotalPnL(prev => prev + pnl);
    }

    // Add trading message to chat
    const tradingMessage = `${newOperation.type === 'buy' ? 'Bought' : 'Sold'} ${newOperation.symbol} at $${newOperation.price.toLocaleString()} (Qty: ${newOperation.quantity})`;
    addChatMessage(tradingMessage, 'system');

    setTradingOperations(prev => [newOperation, ...prev.slice(0, 9)]); // Keep last 10 operations
  };

  const addChatMessage = (message: string, type: 'user' | 'system') => {
    const newMessage = {
      id: Date.now(),
      message,
      timestamp: new Date(),
      type,
    };
    setChatMessages(prev => [newMessage, ...prev.slice(0, 49)]); // Keep last 50 messages
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      addChatMessage(chatInput.trim(), 'user');
      setChatInput('');
    }
  };

  const [tradingIntervals, setTradingIntervals] = useState<{
    countdownInterval: number;
    tradingInterval: number;
  } | null>(null);
  
  // Chat functionality
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    message: string;
    timestamp: Date;
    type: 'user' | 'system';
  }>>([]);
  const [chatInput, setChatInput] = useState('');



  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Investments</Text>

        {/* <View style={styles.chartSection}> */}
        {/* </View> */}
        
        {/* Trading Simulation Interface */}
        {isTrading && (
          <>
          <Chart/>
          <View style={styles.tradingInterface}>
            <View style={styles.tradingOperationsContainer}>
              <Text style={styles.operationsTitle}>Live Trading Operations</Text>
              <ScrollView style={styles.operationsScroll} showsVerticalScrollIndicator={false}>
                {tradingOperations.map((operation) => (
                  <View key={operation.id} style={styles.operationItem}>
                    <View style={styles.operationHeader}>
                      <Text style={[
                        styles.operationType,
                        operation.type === 'buy' ? styles.buyType : styles.sellType
                      ]}>
                        {operation.type === 'buy' ? '📈 BUY' : '📉 SELL'}
                      </Text>
                      <Text style={styles.operationSymbol}>{operation.symbol}</Text>
                      <Text style={styles.operationTime}>
                        {operation.timestamp.toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.operationDetails}>
                      <Text style={styles.operationPrice}>
                        Price: ${operation.price.toLocaleString()}
                      </Text>
                      <Text style={styles.operationQuantity}>
                        Qty: {operation.quantity}
                      </Text>
                      {operation.pnl !== undefined && (
                        <Text style={[
                          styles.operationPnL,
                          operation.pnl >= 0 ? styles.positivePnL : styles.negativePnL
                        ]}>
                          PnL: ${operation.pnl.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
            
            {/* Chat Interface */}
            <View style={styles.chatContainer}>
              <Text style={styles.chatTitle}>Trading Chat</Text>
              
              {/* Chat Messages */}
              <ScrollView style={styles.chatMessagesScroll} showsVerticalScrollIndicator={false}>
                {chatMessages.map((msg) => (
                  <View key={msg.id} style={[
                    styles.chatMessage,
                    msg.type === 'user' ? styles.userMessage : styles.systemMessage
                  ]}>
                    <Text style={[
                      styles.chatMessageText,
                      msg.type === 'user' ? styles.userMessageText : styles.systemMessageText
                    ]}>
                      {msg.message}
                    </Text>
                    <Text style={[
                      styles.chatMessageTime,
                      msg.type === 'user' ? styles.userMessageTime : styles.systemMessageTime
                    ]}>
                      {msg.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              
              {/* Chat Input */}
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Type your message..."
                  placeholderTextColor="#808080"
                  multiline
                />
                <TouchableOpacity 
                  style={styles.sendButton} 
                  onPress={handleSendMessage}
                  disabled={!chatInput.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </>
        )}

        {/* {isTrading && (
          <View style={styles.tradingSection}>
            <Text style={styles.tradingTitle}>Trading</Text>
          </View>
        )} */}


        
        {/* Trading Toggle Button */}
        <TouchableOpacity
          style={[
            styles.tradingButton,
            isTrading ? styles.stopTradingButton : styles.startTradingButton
          ]}
          onPress={toggleTrading}
        >
          <Text style={styles.tradingButtonText}>
            {isTrading ? '🛑 Stop Trading' : '▶️ Start Trading'}
          </Text>
        </TouchableOpacity>
      </View>


      <View style={styles.walletSection}>
        <View style={styles.walletContent}>
          <Text style={styles.sectionTitle}>Wallet Management</Text>
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
                    <TouchableOpacity
                      style={[
                        styles.walletButton,
                        activeWallet?.address === w.address && styles.activeWalletButton
                      ]}
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
                    >
                      <Text style={[
                        styles.walletButtonText,
                        activeWallet?.address === w.address && styles.activeWalletButtonText
                      ]}>
                        {`${w.address.slice(0, 6)}...${w.address.slice(-4)}`}
                      </Text>
                    </TouchableOpacity>

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
            <TouchableOpacity
              style={[styles.createWalletButton, isCreating && styles.disabledButton]}
              disabled={isCreating}
              onPress={() => createWallet({
                onError: (error) => {
                  alert("Error creating wallet: " + error.message);
                },
                onSuccess: ({ wallet }) => {
                  alert("Wallet created successfully: " + wallet?.address);
                },
              })}
            >
              <Text style={styles.createWalletButtonText}>
                {isCreating ? "Creating Wallet..." : "Create Wallet"}
              </Text>
            </TouchableOpacity>

          </View>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => {}}>
            <Text style={styles.addFundsButtonText}>Add Funds</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

        </View>
      </View>
      

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
  chartSection: {
    backgroundColor: '#1a1a2e',
    margin: 10,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  chartPlaceholderText: {
    fontSize: 40,
    marginBottom: 10,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  tradingButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  tradingButtonText: {
    color: '#0f0f23',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startTradingButton: {
    backgroundColor: '#00ff9d',
  },
  stopTradingButton: {
    backgroundColor: '#ff0000',
  },
  walletButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  walletButtonText: {
    color: '#0f0f23',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeWalletButton: {
    backgroundColor: '#2a2a3e',
    opacity: 0.6,
  },
  activeWalletButtonText: {
    color: '#ffffff',
  },
  createWalletButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  createWalletButtonText: {
    color: '#0f0f23',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#2a2a3e',
    opacity: 0.6,
  },
  addFundsButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addFundsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Trading Interface Styles
  tradingInterface: {
    backgroundColor: '#1a1a2e',
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00ff9d',
  },
  tradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tradingStatusText: {
    color: '#00ff9d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPnLText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positivePnL: {
    color: '#00ff9d',
  },
  negativePnL: {
    color: '#ff4757',
  },
  tradingOperationsContainer: {
    marginTop: 15,
  },
  operationsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  operationsScroll: {
    maxHeight: 200,
  },
  operationItem: {
    backgroundColor: '#2a2a3e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff9d',
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  operationType: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buyType: {
    backgroundColor: '#00ff9d',
    color: '#0f0f23',
  },
  sellType: {
    backgroundColor: '#ff4757',
    color: '#ffffff',
  },
  operationSymbol: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  operationTime: {
    color: '#808080',
    fontSize: 12,
  },
  operationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operationPrice: {
    color: '#ffffff',
    fontSize: 12,
  },
  operationQuantity: {
    color: '#ffffff',
    fontSize: 12,
  },
  operationPnL: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Chat Styles
  chatContainer: {
    marginTop: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  chatMessagesScroll: {
    maxHeight: 200,
    marginBottom: 15,
  },
  chatMessage: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#00ff9d',
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  systemMessage: {
    backgroundColor: '#2a2a3e',
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  chatMessageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#0f0f23',
  },
  systemMessageText: {
    color: '#ffffff',
  },
  chatMessageTime: {
    fontSize: 10,
    opacity: 0.7,
  },
  userMessageTime: {
    color: '#0f0f23',
  },
  systemMessageTime: {
    color: '#808080',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#00ff9d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#0f0f23',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
