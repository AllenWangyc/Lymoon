import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const ITEM_HEIGHT = 44;
const PADDING = 2; // phantom items each side so first/last can center

type Props = {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export function TimeWheelPicker({ items, selectedIndex: initialIndex, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useEffect(() => {
    setSelectedIndex(initialIndex);
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [initialIndex]);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const rawY = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(rawY / ITEM_HEIGHT)));
    setSelectedIndex(index);
    onChange(index);
  }

  // Padded array: 2 phantom items on each side
  const paddedItems = ['', '', ...items, '', ''];

  return (
    <View className="w-14">
      <ScrollView
        ref={scrollRef}
        className="h-[220px]"
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {paddedItems.map((item, arrayIndex) => {
          const realIndex = arrayIndex - PADDING;
          const isPhantom = realIndex < 0 || realIndex >= items.length;
          const isSelected = realIndex === selectedIndex;

          if (isPhantom) {
            return <View key={`phantom-${arrayIndex}`} className="h-[44px]" />;
          }

          return (
            <View
              key={`${item}-${realIndex}`}
              className="h-[44px] items-center justify-center"
            >
              <Text
                style={{
                  fontSize: isSelected ? 20 : 15,
                  fontWeight: isSelected ? '700' : '400',
                  color: isSelected ? '#0f172a' : '#94a3b8',
                }}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Top fade overlay */}
      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 h-[88px]"
        style={{ backgroundColor: 'rgba(248,248,246,0.82)' }}
      />
      {/* Bottom fade overlay */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 h-[88px]"
        style={{ backgroundColor: 'rgba(248,248,246,0.82)' }}
      />
      {/* Top separator line */}
      <View
        pointerEvents="none"
        className="absolute top-[88px] left-0 right-0 h-px bg-[#e2e8f0]"
      />
      {/* Bottom separator line */}
      <View
        pointerEvents="none"
        className="absolute top-[132px] left-0 right-0 h-px bg-[#e2e8f0]"
      />
    </View>
  );
}
