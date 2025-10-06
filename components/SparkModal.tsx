import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send } from 'lucide-react-native';

type SparkModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  initialContent?: string;
  isEditing?: boolean;
};

export default function SparkModal({ visible, onClose, onSubmit, initialContent = '', isEditing = false }: SparkModalProps) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setContent(initialContent);
    }
  }, [visible, initialContent]);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error submitting spark:', error);
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Edit Spark' : 'Create Spark'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="What's inspiring you today?"
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={300}
              autoFocus
              editable={!loading}
            />

            <Text style={[styles.charCount, isOverLimit && styles.charCountOver]}>
              {remainingChars} / 280
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                (loading || isOverLimit || !content.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || isOverLimit || !content.trim()}
            >
              <Send size={18} color="#fff" />
              <Text style={styles.buttonText}>
                {loading ? 'Posting...' : isEditing ? 'Update' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  charCountOver: {
    color: '#FF5252',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
