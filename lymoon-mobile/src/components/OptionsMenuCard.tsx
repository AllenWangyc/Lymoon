import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type OptionsMenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  items: OptionsMenuItem[];
  destructiveItem?: OptionsMenuItem;
  style?: ViewStyle;
  iconSize?: number;
};

export function OptionsMenuCard({ items, destructiveItem, style, iconSize = 16 }: Props) {
  return (
    <View
      className="bg-white rounded-[12px] border border-[#e2e8f0]"
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 10,
        },
        style,
      ]}
    >
      <View className="py-[9px] px-px">
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            onPress={item.onPress}
            className="flex-row items-center gap-3 px-4 py-[10px]"
          >
            <Ionicons name={item.icon} size={iconSize} color={item.color ?? '#0f172a'} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: item.color ?? '#0f172a' }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {destructiveItem && (
          <>
            <View className="h-px bg-[#f1f5f9] mx-px" />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={destructiveItem.onPress}
              disabled={destructiveItem.disabled}
              className="flex-row items-center gap-3 px-4 py-[10px]"
              style={{ opacity: destructiveItem.disabled ? 0.4 : 1 }}
            >
              <Ionicons name={destructiveItem.icon} size={iconSize} color={destructiveItem.color} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: destructiveItem.color }}>
                {destructiveItem.label}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
