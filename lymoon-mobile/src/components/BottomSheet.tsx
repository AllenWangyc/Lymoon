import { ReactNode, useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, TouchableWithoutFeedback, View } from 'react-native';

type TimingAnimation = {
  type: 'timing';
  duration?: number;
};

type SpringAnimation = {
  type: 'spring';
  damping?: number;
  stiffness?: number;
};

type CloseAnimation =
  | { type: 'instant' }
  | { type: 'timing'; duration?: number };

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height: number;
  backgroundColor?: string;
  borderRadius?: number;
  showTopBorder?: boolean;
  backdropOpacity?: number;
  elevation?: number;
  openAnimation?: TimingAnimation | SpringAnimation;
  closeAnimation?: CloseAnimation;
  keyboardAware?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height,
  backgroundColor = '#f8f8f6',
  borderRadius = 32,
  showTopBorder = true,
  backdropOpacity = 0.6,
  elevation = 20,
  openAnimation = { type: 'timing', duration: 280 },
  closeAnimation = { type: 'instant' },
  keyboardAware = false,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      if (openAnimation.type === 'spring') {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: openAnimation.damping ?? 20,
          stiffness: openAnimation.stiffness ?? 200,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: openAnimation.duration ?? 280,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (closeAnimation.type === 'timing') {
        Animated.timing(translateY, {
          toValue: height,
          duration: closeAnimation.duration ?? 250,
          useNativeDriver: true,
        }).start();
      } else {
        translateY.setValue(height);
      }
    }
  }, [visible]);

  const Container = keyboardAware ? KeyboardAvoidingView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Container
        className="flex-1 justify-end"
        {...(keyboardAware && { behavior: Platform.OS === 'ios' ? 'padding' : undefined })}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(15,23,42,${backdropOpacity})` }}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            height,
            ...(showTopBorder && {
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.5)',
            }),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.1,
            shadowRadius: 25,
            elevation,
          }}
        >
          {/* Drag handle */}
          <View className="h-6 items-center justify-center pt-2">
            <View className="bg-[#e2e8f0] w-12 h-1.5 rounded-full" />
          </View>

          {children}
        </Animated.View>
      </Container>
    </Modal>
  );
}
