import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

interface Props {
  onPress: () => void;
  tooltip: string;
  children: React.ReactNode;
}

export function HeaderIconBtn({ onPress, tooltip, children }: Props) {
  const [hovered, setHovered] = useState(false);

  const webProps = Platform.OS === 'web'
    ? { onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false) }
    : {};

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.btn, hovered && styles.btnHovered]}
        onPress={onPress}
        {...webProps}
      >
        {children}
      </Pressable>
      {hovered && Platform.OS === 'web' && (
        <View style={styles.tooltipAnchor}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{tooltip}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    zIndex: 20,
  },
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  btnHovered: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tooltipAnchor: {
    position: 'absolute',
    top: 40,
    left: -80,
    right: -80,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  } as any,
  tooltip: {
    backgroundColor: 'rgba(40,40,40,0.96)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 11,
    textAlign: 'center',
  },
});
