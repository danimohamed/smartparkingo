import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/guard_chat.dart';
import '../../services/guard_chat_service.dart';
import '../../utils/theme.dart';
import 'guard_chat_thread_screen.dart';

/// Lists guard ↔ user conversations (same API as web `/messages`).
class GuardChatsListScreen extends StatefulWidget {
  const GuardChatsListScreen({super.key});

  @override
  State<GuardChatsListScreen> createState() => _GuardChatsListScreenState();
}

class _GuardChatsListScreenState extends State<GuardChatsListScreen> {
  final GuardChatService _api = GuardChatService();
  List<GuardChatSummary> _chats = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.listChats();
      if (mounted) {
        setState(() {
          _chats = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Guard chats'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text(_error!, style: const TextStyle(color: AppTheme.errorColor)),
          const SizedBox(height: 16),
          FilledButton(onPressed: _load, child: const Text('Retry')),
        ],
      );
    }
    if (_chats.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: const [
          SizedBox(height: 48),
          Icon(Icons.chat_bubble_outline, size: 56, color: AppTheme.textSecondary),
          SizedBox(height: 16),
          Text(
            'No chats yet',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 8),
          Text(
            'Book a spot at a parking that has a guard. A chat opens automatically after booking.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textSecondary, height: 1.4),
          ),
        ],
      );
    }
    final fmt = DateFormat.MMMd().add_Hm();
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _chats.length,
      separatorBuilder: (context, _) => const Divider(height: 1),
      itemBuilder: (context, i) {
        final c = _chats[i];
        final sub = c.updatedAt != null ? fmt.format(c.updatedAt!.toLocal()) : '';
        return ListTile(
          leading: const CircleAvatar(
            child: Icon(Icons.person_outline),
          ),
          title: Text(
            c.peerFullName,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: Text('${c.parkingName}${sub.isNotEmpty ? ' · $sub' : ''}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => GuardChatThreadScreen(
                  chatId: c.id,
                  peerName: c.peerFullName,
                  parkingName: c.parkingName,
                  guardPhone: c.guardPhone,
                ),
              ),
            );
            if (mounted) _load();
          },
        );
      },
    );
  }
}
