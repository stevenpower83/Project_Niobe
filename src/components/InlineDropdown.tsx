import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  value: string;
  options: string[];
  labels?: string[];
  placeholder?: string;
  onSelect: (value: string) => void;
}

export function InlineDropdown({ value, options, labels, placeholder, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const displayLabels = labels ?? options;
  const idx = options.indexOf(value);
  const selectedLabel = idx >= 0 ? displayLabels[idx] : null;

  return (
    <View style={[styles.wrapper, open && styles.wrapperOpen]}>
      <Pressable
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => { Keyboard.dismiss(); setOpen((v) => !v); }}
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
      {open && (
        <View style={styles.list}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {options.map((opt, i) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{displayLabels[i]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 300,
    zIndex: 1,
  },
  wrapperOpen: {
    zIndex: 100,
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
  list: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    zIndex: 100,
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
    flexGrow: 0,
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
