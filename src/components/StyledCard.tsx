import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export function StyledCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
