import { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightElement?: ReactNode;
}

const pillShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

export function PageHeader({ title, subtitle, onBack, rightElement }: PageHeaderProps) {
  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
        style={pillShadow}
      >
        <Ionicons name="chevron-back" size={16} color="#0f172a" />
      </TouchableOpacity>

      <View className="flex-1 items-center px-3">
        <Text
          style={{ fontSize: 20, fontWeight: '600', color: '#0f172a', letterSpacing: -0.3 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5" style={{ fontSize: 14, color: '#64748b' }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement ?? <View className="size-10" />}
    </View>
  );
}
