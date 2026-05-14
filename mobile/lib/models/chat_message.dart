enum MessageType {
  text,
  parkingOptions,
  timeSelection,
  paymentConfirm,
  guardChatCta,
}

class ChatOption {
  final String id;
  final String label;
  final String? subtitle;
  final Map<String, dynamic>? data;

  const ChatOption({
    required this.id,
    required this.label,
    this.subtitle,
    this.data,
  });
}

class ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final bool isError;
  final DateTime timestamp;
  final MessageType type;
  final List<ChatOption>? options;
  final Map<String, dynamic>? metadata;

  ChatMessage({
    required this.role,
    required this.content,
    this.isError = false,
    this.type = MessageType.text,
    this.options,
    this.metadata,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
  bool get isInteractive => type != MessageType.text;
}
