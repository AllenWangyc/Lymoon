import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Modal, TouchableWithoutFeedback, View } from 'react-native';

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: `rgba(15,23,42,${backdropOpacity})`,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
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
          <View style={{ height: 24, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
            <View style={{ backgroundColor: '#e2e8f0', width: 48, height: 6, borderRadius: 9999 }} />
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
