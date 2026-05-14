import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/chat_message.dart';
import '../models/parking.dart';
import '../models/parking_slot.dart';
import '../services/gemini_service.dart';

enum BookingState {
  idle,
  awaitingParkingChoice,
  awaitingTimeSelection,
  awaitingConfirmation,
}

class ChatProvider extends ChangeNotifier {
  final GeminiService _gemini = GeminiService();

  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  BookingState _bookingState = BookingState.idle;
  List<Parking> _nearbyParkings = [];
  Parking? _selectedParking;
  ParkingSlot? _selectedSlot;
  DateTime? _selectedStart;
  DateTime? _selectedEnd;
  double _walletBalance = 0;

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  bool get isTyping => _isTyping;
  bool get hasMessages => _messages.isNotEmpty;
  BookingState get bookingState => _bookingState;
  Parking? get selectedParking => _selectedParking;
  double get walletBalance => _walletBalance;

  List<ChatMessage> get _historyForGemini {
    return _messages
        .where((m) => !m.isError && m.type == MessageType.text)
        .toList()
        .reversed
        .take(10)
        .toList()
        .reversed
        .toList();
  }

  // ─── Normal chat (delegates to Gemini) ──────────────────────

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    _messages.add(ChatMessage(role: 'user', content: text.trim()));
    _messages.add(ChatMessage(role: 'assistant', content: '…'));
    _isTyping = true;
    notifyListeners();

    try {
      final fullResponse = await _gemini.sendMessage(
        text.trim(),
        _historyForGemini,
        onChunk: (partial) {
          if (_messages.isNotEmpty && _messages.last.isAssistant) {
            _messages.last = ChatMessage(role: 'assistant', content: partial);
            notifyListeners();
          }
        },
      );

      final parsed = GeminiService.parseActions(fullResponse);

      if (parsed.actions.isNotEmpty) {
        _messages.last = ChatMessage(
          role: 'assistant',
          content: parsed.cleanText.isNotEmpty
              ? parsed.cleanText
              : '⏳ Processing your request…',
        );
        notifyListeners();

        for (final action in parsed.actions) {
          final result = await _gemini.executeAction(action);
          _messages.add(ChatMessage(
            role: 'assistant',
            content: result.message,
            isError: !result.success,
          ));
          notifyListeners();
        }
      } else {
        _messages.last = ChatMessage(
          role: 'assistant',
          content: parsed.cleanText.isNotEmpty ? parsed.cleanText : fullResponse,
        );
        notifyListeners();
      }

      _injectBookingOptions(text.trim());
    } catch (e, stackTrace) {
      debugPrint('[ParkBot Error] $e');
      debugPrint('[ParkBot Stack] $stackTrace');
      final errMsg = e.toString();
      String userMsg = '⚠️ Sorry, something went wrong. Please try again.';
      if (errMsg.contains('RATE_LIMITED') || errMsg.contains('429')) {
        userMsg = '⏳ Too many requests — please wait 10 seconds and try again.';
      } else if (errMsg.contains('API_KEY_INVALID')) {
        userMsg = '🔑 The AI API key is invalid or expired.';
      } else if (errMsg.contains('EMPTY_RESPONSE')) {
        userMsg = '🤔 The AI returned an empty response. Try rephrasing.';
      }
      _messages.last = ChatMessage(
        role: 'assistant',
        content: userMsg,
        isError: true,
      );
      notifyListeners();
    } finally {
      _isTyping = false;
      notifyListeners();
    }
  }

  // ─── Inject interactive booking widgets after Gemini responds ─

  void _injectBookingOptions(String userText) {
    final q = userText.toLowerCase();
    final isBookingRequest = RegExp(
      r'book|reserve|réserv|parking spot|place|حجز',
    ).hasMatch(q);

    if (!isBookingRequest || _bookingState != BookingState.idle) return;

    final ctx = _gemini.lastContext;
    final parkings = ctx['parkings'] as List<Parking>?;
    if (parkings == null || parkings.isEmpty) return;

    final seen = <String>{};
    _nearbyParkings = parkings
        .where((p) => p.availableSlots > 0 && seen.add(p.name))
        .take(3)
        .toList();

    if (_nearbyParkings.isEmpty) return;

    _walletBalance = (ctx['balance'] as double?) ?? 0;

    _bookingState = BookingState.awaitingParkingChoice;
    _messages.add(ChatMessage(
      role: 'assistant',
      content: 'Pick a parking:',
      type: MessageType.parkingOptions,
      options: _nearbyParkings.map((p) {
        final price = p.pricePerHour == p.pricePerHour.roundToDouble()
            ? '${p.pricePerHour.toInt()}'
            : '${p.pricePerHour}';
        final dist = p.distance != null
            ? '${p.distance!.toStringAsFixed(1)} km'
            : '';
        return ChatOption(
          id: p.id.toString(),
          label: p.name,
          subtitle: '${p.availableSlots} spots · $price MAD/h${dist.isNotEmpty ? ' · $dist' : ''}',
          data: {'parkingId': p.id},
        );
      }).toList(),
    ));
    notifyListeners();
  }

  // ─── Step 4-5: User picks a parking ─────────────────────────

  Future<void> selectParking(ChatOption option) async {
    if (_bookingState != BookingState.awaitingParkingChoice) return;

    _messages.add(ChatMessage(role: 'user', content: option.label));

    _selectedParking = _nearbyParkings.firstWhere(
      (p) => p.id.toString() == option.id,
    );
    notifyListeners();

    _isTyping = true;
    notifyListeners();

    try {
      final slots = await _gemini.slotService
          .getAvailableSlots(_selectedParking!.id);
      if (slots.isEmpty) {
        _messages.add(ChatMessage(
          role: 'assistant',
          content: 'Sorry, no available slots right now at ${_selectedParking!.name}. Try another parking.',
          isError: true,
        ));
        _bookingState = BookingState.idle;
        _isTyping = false;
        notifyListeners();
        return;
      }

      _selectedSlot = slots.first;

      final now = DateTime.now().toUtc().add(const Duration(hours: 1));
      final defaultStart = DateTime(
        now.year, now.month, now.day, now.hour,
        now.minute < 30 ? 30 : 0,
      ).add(now.minute < 30 ? Duration.zero : const Duration(hours: 1));

      _bookingState = BookingState.awaitingTimeSelection;
      _isTyping = false;

      _messages.add(ChatMessage(
        role: 'assistant',
        content: 'Choose your reservation time for ${_selectedParking!.name}',
        type: MessageType.timeSelection,
        metadata: {
          'parkingName': _selectedParking!.name,
          'pricePerHour': _selectedParking!.pricePerHour,
          'slotNumber': _selectedSlot!.slotNumber,
          'slotFloor': _selectedSlot!.floor ?? 'RDC',
          'slotType': _selectedSlot!.slotType,
          'defaultStart': defaultStart.toIso8601String(),
          'walletBalance': _walletBalance,
        },
      ));
      notifyListeners();
    } catch (e) {
      debugPrint('[ParkBot] Slot fetch error: $e');
      _messages.add(ChatMessage(
        role: 'assistant',
        content: '⚠️ Could not load slots. Please try again.',
        isError: true,
      ));
      _bookingState = BookingState.idle;
      _isTyping = false;
      notifyListeners();
    }
  }

  // ─── Step 6-7: User selects time ────────────────────────────

  void selectTime(DateTime start, DateTime end) {
    if (_bookingState != BookingState.awaitingTimeSelection) return;
    if (_selectedParking == null || _selectedSlot == null) return;

    _selectedStart = start;
    _selectedEnd = end;

    final hours = end.difference(start).inMinutes / 60;
    final cost = (hours.ceil()) * _selectedParking!.pricePerHour;

    final timeRange = '${_fmtTime(start)} → ${_fmtTime(end)}';

    _messages.add(ChatMessage(
      role: 'user',
      content: 'Book from $timeRange (${hours.ceil()}h)',
    ));

    _bookingState = BookingState.awaitingConfirmation;
    _messages.add(ChatMessage(
      role: 'assistant',
      content: 'Booking summary',
      type: MessageType.paymentConfirm,
      metadata: {
        'parkingName': _selectedParking!.name,
        'slotNumber': _selectedSlot!.slotNumber,
        'slotFloor': _selectedSlot!.floor ?? 'RDC',
        'slotType': _selectedSlot!.slotType,
        'startTime': start.toIso8601String(),
        'endTime': end.toIso8601String(),
        'timeRange': timeRange,
        'hours': hours.ceil(),
        'cost': cost,
        'walletBalance': _walletBalance,
        'sufficient': _walletBalance >= cost,
      },
    ));
    notifyListeners();
  }

  // ─── Step 8-10: User confirms & pays ────────────────────────

  Future<void> confirmBooking([String? vehiclePlate]) async {
    if (_bookingState != BookingState.awaitingConfirmation) return;
    if (_selectedSlot == null || _selectedStart == null || _selectedEnd == null) return;

    _messages.add(ChatMessage(role: 'user', content: 'Confirm booking ✓'));
    _isTyping = true;
    notifyListeners();

    try {
      // Backend auto-charges wallet on reservation creation
      final reservation = await _gemini.reservationService.createReservation(
        parkingSlotId: _selectedSlot!.id,
        startTime: _selectedStart!,
        endTime: _selectedEnd!,
        vehiclePlate: vehiclePlate,
      );

      final bal = await _gemini.walletService.getBalance();
      _walletBalance = bal.balance;

      final costStr = reservation.totalPrice == reservation.totalPrice.roundToDouble()
          ? '${reservation.totalPrice.toInt()}'
          : '${reservation.totalPrice}';
      final balStr = _walletBalance == _walletBalance.roundToDouble()
          ? '${_walletBalance.toInt()}'
          : '$_walletBalance';

      _messages.add(ChatMessage(
        role: 'assistant',
        content: '✅ Reservation booked & paid! 🎉\n\n'
            '📍 ${reservation.parkingName}\n'
            '🅿️ Slot ${reservation.slotNumber}\n'
            '🕐 ${_fmtTime(_selectedStart!)} → ${_fmtTime(_selectedEnd!)}\n'
            '💰 $costStr MAD deducted from wallet\n'
            '💳 Remaining balance: $balStr MAD\n\n'
            'Have a great parking experience! 🚗',
      ));

      final guardIds = reservation.guardChatIds;
      if (guardIds != null && guardIds.isNotEmpty) {
        _messages.add(ChatMessage(
          role: 'assistant',
          content:
              'Need help with directions, access, or anything else? Don’t hesitate to contact the guard assigned to this parking.',
          type: MessageType.guardChatCta,
          metadata: {
            'chatId': guardIds.first,
            'parkingName': reservation.parkingName,
          },
        ));
      } else {
        _messages.add(ChatMessage(
          role: 'assistant',
          content:
              'If you need help later, open Guard chats from the menu — we’ll connect you when a guard is available for your lot.',
        ));
      }

      _resetBooking();
      _isTyping = false;
      notifyListeners();
    } catch (e) {
      debugPrint('[ParkBot] Reservation error: $e');
      String msg = '⚠️ Could not create reservation.';
      final errStr = e.toString();
      if (errStr.contains('Insufficient')) {
        msg = '❌ Insufficient wallet balance. Please top up your wallet first.';
      } else if (errStr.contains('not available')) {
        msg = '❌ This slot is no longer available. Please try another parking.';
      }
      _messages.add(ChatMessage(
        role: 'assistant',
        content: msg,
        isError: true,
      ));
      _resetBooking();
      _isTyping = false;
      notifyListeners();
    }
  }

  void cancelBooking() {
    _messages.add(ChatMessage(role: 'user', content: 'Cancel'));
    _messages.add(ChatMessage(
      role: 'assistant',
      content: 'No problem! Let me know if you need anything else. 😊',
    ));
    _resetBooking();
    notifyListeners();
  }

  void _resetBooking() {
    _bookingState = BookingState.idle;
    _selectedParking = null;
    _selectedSlot = null;
    _selectedStart = null;
    _selectedEnd = null;
  }

  void clearMessages() {
    _messages.clear();
    _resetBooking();
    notifyListeners();
  }

  static String _fmtTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
