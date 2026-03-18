import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/components/Toast';

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + 8;

  // Animated.Value for position — kept alive for the lifetime of the provider.
  // -200 ensures it starts fully off-screen regardless of card height.
  const translateY = useRef(new Animated.Value(-200)).current;

  // Stores the current running animation so it can be stopped on replacement or unmount.
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Auto-dismiss timer ref.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');

  // Cleanup on unmount — stop any in-flight animation so its callback
  // does not call setState on an unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      animationRef.current?.stop();
    };
  }, []);

  // Shared dismiss path — used by auto-dismiss timer AND manual X press.
  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    animationRef.current?.stop();

    const anim = Animated.timing(translateY, {
      toValue: -200,
      duration: 250,
      useNativeDriver: true,
    });
    animationRef.current = anim;
    // No state update needed — component stays mounted at -200 (off-screen).
    anim.start();
  }, [translateY]);

  const showToast = useCallback(
    (msg: string, toastType: 'success' | 'error' = 'success', duration = 3000) => {
      // Cancel any in-progress animation and timer.
      if (timerRef.current) clearTimeout(timerRef.current);
      animationRef.current?.stop();
      // Hard-reset position to off-screen before starting fresh slide-in.
      translateY.setValue(-200);

      setMessage(msg);
      setType(toastType);

      const anim = Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      });
      animationRef.current = anim;
      anim.start();

      timerRef.current = setTimeout(dismiss, duration);
    },
    [translateY, dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={message}
        type={type}
        onClose={dismiss}
        translateY={translateY}
        topOffset={topOffset}
      />
    </ToastContext.Provider>
  );
}
