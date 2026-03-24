import { View, Text } from 'react-native';
import { getAvatarColor } from '@/utils/avatarColor';

type Props = {
  name: string;
  initials: string;
  size?: number;
};

export function UserAvatar({ name, initials, size = 40 }: Props) {
  const { bg, text } = getAvatarColor(name);
  const fontSize = size <= 36 ? 11 : 13;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize, fontWeight: '700', color: text }}>{initials}</Text>
    </View>
  );
}
