import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Keyboard, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  value: string;
  options: string[];
  labels?: string[];
  placeholder?: string;
  onSelect: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export function InlineDropdown({ value, options, labels, placeholder, onSelect, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const displayLabels = labels ?? options;
  const idx = options.indexOf(value);
  const selectedLabel = idx >= 0 ? displayLabels[idx] : null;

  function handleOpen() {
    Keyboard.dismiss();
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setOpen(true);
      onOpenChange?.(true);
    });
  }

  function handleClose() {
    setOpen(false);
    onOpenChange?.(false);
  }

  return (
    <View style={styles.wrapper}>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={[styles.trigger, open && styles.triggerOpen]}
          onPress={handleOpen}
        >
          <Text style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
            {selectedLabel ?? placeholder ?? ''}
          </Text>
          <Ionicons
            name={open ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            style={[
              styles.list,
              triggerLayout ? {
                position: 'absolute',
                top: triggerLayout.y + triggerLayout.height,
                left: triggerLayout.x,
                width: triggerLayout.width,
              } : {},
            ]}
            onPress={() => {}}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={styles.scroll}
            >
              {options.map((opt, i) => (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => {
                    onSelect(opt);
                    handleClose();
                  }}
                >
                  <Text style={styles.optionText}>{displayLabels[i]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 300,
  },
  trigger: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#3a3030',
  },
  triggerText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  overlay: {
    flex: 1,
  },
  list: {
    maxHeight: 260,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#3a3030',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#1e1a1a',
    overflow: 'hidden',
  },
  scroll: {
    maxHeight: 260,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2020',
  },
  optionPressed: {
    backgroundColor: '#2e1a1a',
  },
  optionText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
});
