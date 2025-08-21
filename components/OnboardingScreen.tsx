import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import onboardingQuestions from '../data/onboardingQuestions.json';

interface Question {
  id: number;
  question: string;
  type: 'single_choice' | 'multiple_choice';
  options: string[];
  required: boolean;
  maxSelections?: number;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [loading, setLoading] = useState(false);

  const currentQuestion = onboardingQuestions.questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    if (currentQuestion.type === 'single_choice') {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    } else if (currentQuestion.type === 'multiple_choice') {
      const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
      let newAnswers: string[];
      
      if (currentAnswers.includes(answer)) {
        // Remove if already selected
        newAnswers = currentAnswers.filter(a => a !== answer);
      } else {
        // Add if not selected and under max limit
        if (currentQuestion.maxSelections && currentAnswers.length >= currentQuestion.maxSelections) {
          Alert.alert('Selection Limit', `You can only select up to ${currentQuestion.maxSelections} options.`);
          return;
        }
        newAnswers = [...currentAnswers, answer];
      }
      
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswers }));
    }
  };

  const isAnswerSelected = (option: string): boolean => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'single_choice') {
      return answer === option;
    } else if (currentQuestion.type === 'multiple_choice') {
      return (answer as string[])?.includes(option) || false;
    }
    return false;
  };

  const canProceed = (): boolean => {
    const answer = answers[currentQuestion.id];
    if (!currentQuestion.required) return true;
    
    if (currentQuestion.type === 'single_choice') {
      return !!answer;
    } else if (currentQuestion.type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return false;
  };

  const handleNext = () => {
    if (currentQuestionIndex < onboardingQuestions.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Store answers in AsyncStorage
      await AsyncStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (): number => {
    return ((currentQuestionIndex + 1) / onboardingQuestions.questions.length) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} of {onboardingQuestions.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          {currentQuestion.type === 'multiple_choice' && currentQuestion.maxSelections && (
            <Text style={styles.selectionLimit}>
              Select up to {currentQuestion.maxSelections} options
            </Text>
          )}
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isAnswerSelected(option) && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswer(option)}
            >
              <Text style={[
                styles.optionText,
                isAnswerSelected(option) && styles.optionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevious}
            disabled={loading}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.primaryButton,
            !canProceed() && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          <Text style={styles.primaryButtonText}>
            {currentQuestionIndex === onboardingQuestions.questions.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  progressContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1a2e',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2a2a3e',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff9d',
    borderRadius: 3,
  },
  progressText: {
    color: '#808080',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
  },
  selectionLimit: {
    fontSize: 14,
    color: '#00ff9d',
    textAlign: 'center',
    marginTop: 10,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  optionButtonSelected: {
    backgroundColor: '#00ff9d',
    borderColor: '#00ff9d',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#0f0f23',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#00ff9d',
  },
  disabledButton: {
    backgroundColor: '#2a2a3e',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#0f0f23',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 