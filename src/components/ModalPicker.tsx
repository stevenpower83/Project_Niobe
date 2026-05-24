import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  visible: boolean;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  title?: string;
}

export function ModalPicker({ visible, options, onSelect, onClose, title }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {title && <Text style={styles.title}>{title}</Text>}
          <ScrollView>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    width: '80%',
    maxHeight: '60%',
    paddingVertical: 8,
  },
  title: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionPressed: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
});
