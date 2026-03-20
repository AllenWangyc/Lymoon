import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Permission = 'manager_only' | 'full_collaboration';

interface Props {
  value: Permission;
  onChange: (v: Permission) => void;
}

interface CardOption {
  key: Permission;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
}

const OPTIONS: CardOption[] = [
  {
    key: 'manager_only',
    icon: 'shield-checkmark-outline',
    title: 'Manager Only',
    description: 'Only manager can edit shifts; members have read-only access',
  },
  {
    key: 'full_collaboration',
    icon: 'people-outline',
    title: 'Full Collaboration',
    description: 'All members can add, edit and delete any shift',
  },
];

function PermissionCard({
  option,
  isSelected,
  onPress,
}: {
  option: CardOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-start w-full rounded-2xl p-[18px]"
      style={{
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: isSelected ? '#b6ec13' : 'rgba(182, 236, 19, 0.15)',
        minHeight: 84,
      }}
    >
      <View
        className="items-center justify-center rounded-full mr-3"
        style={{
          width: 40,
          height: 40,
          backgroundColor: isSelected
            ? 'rgba(182, 236, 19, 0.1)'
            : '#f1f5f9',
        }}
      >
        <Ionicons
          name={option.icon}
          size={20}
          color={isSelected ? '#4d7c0f' : '#64748b'}
        />
      </View>

      <View className="flex-1">
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: 2,
          }}
        >
          {option.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: '#64748b',
            lineHeight: 16,
          }}
        >
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function PermissionPicker({ value, onChange }: Props) {
  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: '#64748b',
          marginBottom: 8,
        }}
      >
        You will be the manager of this schedule
      </Text>

      <View style={{ gap: 12 }}>
        {OPTIONS.map((option) => (
          <PermissionCard
            key={option.key}
            option={option}
            isSelected={value === option.key}
            onPress={() => onChange(option.key)}
          />
        ))}
      </View>
    </View>
  );
}
