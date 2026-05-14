import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';
import '../models/parking.dart';
import '../models/parking_slot.dart';
import '../models/reservation.dart';
import '../models/wallet.dart';
import '../models/payment.dart';
import '../utils/constants.dart';
import 'location_service.dart';
import 'parking_service.dart';
import 'parking_slot_service.dart';
import 'reservation_service.dart';
import 'wallet_service.dart';
import 'payment_service.dart';
import '../utils/plate_helpers.dart';

class GeminiService {
  static const _models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];

  static String? _lastWorkingModel;

  final parkingService = ParkingService();
  final slotService = ParkingSlotService();
  final reservationService = ReservationService();
  final walletService = WalletService();
  final _paymentService = PaymentService();
  final _locationService = LocationService();
  final _dio = Dio();

  Map<String, dynamic> lastContext = {};

  static double _distanceKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = _deg2rad(lat2 - lat1);
    final dLon = _deg2rad(lon2 - lon1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_deg2rad(lat1)) * math.cos(_deg2rad(lat2)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  static double _deg2rad(double deg) => deg * (math.pi / 180);

  String _geminiUrl(String model, {bool stream = false}) {
    final action = stream ? 'streamGenerateContent' : 'generateContent';
    final alt = stream ? '&alt=sse' : '';
    return 'https://generativelanguage.googleapis.com/v1beta/models/$model:$action?key=${AppConstants.geminiApiKey}$alt';
  }

  List<String> get _orderedModels {
    if (_lastWorkingModel == null || _lastWorkingModel == _models[0]) {
      return _models;
    }
    return [_lastWorkingModel!, ..._models.where((m) => m != _lastWorkingModel)];
  }

  String _nowMorocco() {
    final now = DateTime.now().toUtc().add(const Duration(hours: 1));
    return now.toIso8601String().split('.').first;
  }

  String get _systemPrompt => '''You are ParkBot, the full-service AI assistant for SmartParking in Marrakech, Morocco.
You manage the ENTIRE parking booking experience through chat.

Currency: MAD (Moroccan Dirham). Pricing: per hour, minimum 1 hour, cost = ceil(hours) x pricePerHour.

=== WHAT YOU CAN DO ===
1. Search & list parkings (name, location, price, availability)
2. Show user's reservations, payments, wallet balance, transactions
3. CREATE a reservation (pick slot, time, confirm, book)
4. CANCEL a reservation
5. PAY for a reservation using wallet
6. Calculate costs, compare prices, recommend parkings
7. Answer questions about Marrakech parking tips

=== RULES ===
- Respond in the SAME language as the user (English, French, Arabic darija)
- Keep answers SHORT and conversational — this is a VOICE assistant, the user will HEAR your response spoken aloud
- When listing parkings, show only the TOP 3 CLOSEST to the user. Each must be a DIFFERENT parking (never repeat the same name). For each, say ONLY: name, distance, available spots, and price per hour
- For prices, say whole numbers naturally (e.g. "5 dirhams per hour" NOT "5.0 MAD/h" or "5.00 MAD"). Drop decimals if they are .0
- Do NOT list IDs, addresses, or technical details in your responses — keep those internal for action blocks only
- Never list all 30 parkings — the user only needs 3 choices
- ONLY use data from [CONTEXT] blocks below — never invent IDs, names, or prices
- Slot types: STANDARD, VIP, ELECTRIC, HANDICAPPED
- Floors: RDC=ground, 1-4=above, -1 to -5=underground

=== ACTIONS ===
You can execute real backend actions by including ONE action block per response.
Format EXACTLY:

```action
{"type":"reserve","parkingSlotId":123,"startTime":"2026-03-26T14:00:00","endTime":"2026-03-26T16:00:00"}
```

```action
{"type":"cancel","reservationId":456}
```

```action
{"type":"pay","reservationId":456}
```

=== BOOKING FLOW (you MUST follow this) ===
1. USER ASKS TO BOOK -> Show TOP 3 CLOSEST parkings with: name, distance, free spots, price (e.g. "Parking Massira — 1.2km away, 39 spots, 4 dirhams per hour"). Ask which one they want.
2. USER PICKS A PARKING (or you recommend one) -> Pick the best available slot automatically (prefer STANDARD type). Show brief summary.
3. USER CONFIRMS OR YOU PICK BEST MATCH -> Show a SHORT SUMMARY before booking:
   **Booking Summary**
   - Parking: [name]
   - Slot: [number] (floor [X], [type])
   - Time: [start] -> [end] ([N] hours)
   - Cost: [amount] MAD
   - Wallet: [balance] MAD [sufficient / insufficient]
   Then ask: "Shall I confirm this reservation?"
4. USER CONFIRMS ("yes", "ok", "confirm", "oui") -> Output the action block + confirmation message
5. AFTER BOOKING -> Remind user to pay: "Your reservation is created! Pay [X] MAD from your wallet? (say 'pay')"

=== CANCELLATION FLOW ===
1. Show user's active reservations
2. User picks one -> Show details + ask "Are you sure?"
3. User confirms -> Output cancel action

=== PAYMENT FLOW ===
1. User says "pay" or "pay for reservation #X" -> Check wallet balance >= cost
2. If sufficient -> Output pay action
3. If insufficient -> Tell user their balance and how much more they need

=== VALIDATION RULES ===
- NEVER output an action block without ALL required fields
- NEVER guess slot IDs — only use IDs from [AVAILABLE SLOTS]
- startTime MUST be in the future. Default: current time + 10 minutes, rounded to next quarter hour
- endTime = startTime + requested hours (minimum 1h)
- Before reserve action: verify wallet balance >= estimated cost. Warn if insufficient (but still allow booking since payment is separate)
- Before pay action: verify wallet balance >= payment amount. REFUSE if insufficient.
- If something is missing, ASK the user — never assume

Current date/time: ${_nowMorocco()}''';

  // ─── Context fetching ──────────────────────────────────────

  Future<Map<String, dynamic>> _fetchLiveContext(String msg) async {
    final ctx = <String, dynamic>{};
    final q = msg.toLowerCase();

    final futures = <Future>[];

    futures.add(walletService.getBalance().then((w) {
      ctx['balance'] = w.balance;
    }).catchError((_) {}));

    futures.add(_locationService.getCurrentLocation().then((pos) {
      if (pos != null) {
        ctx['userLat'] = pos.latitude;
        ctx['userLng'] = pos.longitude;
      }
    }).catchError((_) {}));

    final needsParkings = RegExp(r'park|slot|find|avail|dispo|cheap|price|prix|وقوف|near|proche|reserv|book|حجز|réserv|reserve|cher').hasMatch(q);
    final needsReservations = RegExp(r'reserv|book|cancel|my |mes |حجز|réserv|pay|annul|show|list|history|histor').hasMatch(q);
    final needsPayments = RegExp(r'pay|paid|payment|paiement|دفع|wallet|trans|factur').hasMatch(q);
    final needsSlots = RegExp(r'reserv|book|حجز|réserv|reserve|slot|place|crén').hasMatch(q);

    if (needsParkings) {
      futures.add(parkingService.getActiveParkings().then((parkings) {
        ctx['parkings'] = parkings;
      }).catchError((_) {}));
    }

    if (needsReservations) {
      futures.add(reservationService.getMyReservations().then((res) {
        ctx['reservations'] = res;
      }).catchError((_) {}));
    }

    if (needsPayments) {
      futures.add(_paymentService.getMyPayments().then((payments) {
        ctx['payments'] = payments;
      }).catchError((_) {}));
      futures.add(walletService.getTransactions().then((txns) {
        ctx['transactions'] = txns;
      }).catchError((_) {}));
    }

    await Future.wait(futures);

    if (ctx['parkings'] != null) {
      final userLat = ctx['userLat'] as double?;
      final userLng = ctx['userLng'] as double?;
      final parkings = ctx['parkings'] as List<Parking>;

      if (userLat != null && userLng != null) {
        for (final p in parkings) {
          if (p.hasLocation) {
            p.distance = _distanceKm(userLat, userLng, p.latitude!, p.longitude!);
          }
        }
        parkings.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
      }
      ctx['parkings'] = parkings;
    }

    if (needsSlots && ctx['parkings'] != null) {
      final parkings = (ctx['parkings'] as List<Parking>)
          .where((p) => p.availableSlots > 0)
          .take(3)
          .toList();
      final slotFutures = parkings.map((p) async {
        try {
          final slots = await slotService.getAvailableSlots(p.id);
          return {'parking': p, 'slots': slots.take(5).toList()};
        } catch (_) {
          return {'parking': p, 'slots': <ParkingSlot>[]};
        }
      });
      ctx['availableSlots'] = await Future.wait(slotFutures);
    }

    return ctx;
  }

  String _buildContextBlock(Map<String, dynamic> ctx) {
    final buf = StringBuffer();

    if (ctx['balance'] != null) {
      buf.writeln('[WALLET BALANCE] ${ctx['balance']} MAD');
    }

    if (ctx['parkings'] != null) {
      final seen = <String>{};
      final parkings = (ctx['parkings'] as List<Parking>)
          .where((p) => p.availableSlots > 0 && seen.add(p.name))
          .toList();
      buf.writeln('\n[LIVE PARKING DATA] (sorted by distance — show only top 3 closest to user)');
      for (final p in parkings.take(5)) {
        final price = p.pricePerHour == p.pricePerHour.roundToDouble()
            ? p.pricePerHour.toInt().toString()
            : p.pricePerHour.toString();
        final dist = p.distance != null
            ? '${p.distance!.toStringAsFixed(1)}km away'
            : 'distance unknown';
        buf.writeln('- ${p.name} (ID:${p.id}) | $price dirhams/h | ${p.availableSlots} spots free | $dist');
      }
    }

    if (ctx['availableSlots'] != null) {
      buf.writeln('\n[AVAILABLE SLOTS]');
      for (final entry in ctx['availableSlots'] as List) {
        final parking = entry['parking'] as Parking;
        final slots = entry['slots'] as List<ParkingSlot>;
        if (slots.isNotEmpty) {
          buf.writeln('${parking.name} (parkingID:${parking.id}, ${parking.pricePerHour} MAD/h):');
          for (final s in slots) {
            buf.writeln('  - slotId:${s.id} | ${s.slotNumber} | floor:${s.floor} | type:${s.slotType}');
          }
        }
      }
    }

    if (ctx['reservations'] != null) {
      buf.writeln('\n[MY RESERVATIONS]');
      for (final r in ctx['reservations'] as List<Reservation>) {
        buf.writeln('- Reservation #${r.id} | ${r.parkingName} | slot ${r.slotNumber} (slotId:${r.parkingSlotId}) | ${r.startTime} -> ${r.endTime} | ${r.status} | ${r.totalPrice} MAD');
      }
    }

    if (ctx['payments'] != null) {
      buf.writeln('\n[MY PAYMENTS]');
      for (final p in ctx['payments'] as List<Payment>) {
        buf.writeln('- Payment #${p.id} for reservation #${p.reservationId} | ${p.amount} MAD | ${p.status} | ${p.paymentMethod ?? 'N/A'}');
      }
    }

    if (ctx['transactions'] != null) {
      buf.writeln('\n[WALLET TRANSACTIONS]');
      for (final t in ctx['transactions'] as List<WalletTransaction>) {
        buf.writeln('- ${t.type}: ${t.amount} MAD | ${t.description ?? ''} | ${t.createdAt}');
      }
    }

    return buf.toString();
  }

  List<Map<String, dynamic>> _buildContents(
    String userMessage,
    List<ChatMessage> history,
    String contextBlock,
  ) {
    final fullMsg = contextBlock.isNotEmpty
        ? '$userMessage\n\n--- LIVE CONTEXT ---\n$contextBlock'
        : userMessage;

    return [
      {
        'role': 'user',
        'parts': [{'text': '[SYSTEM INSTRUCTIONS]\n$_systemPrompt'}]
      },
      {
        'role': 'model',
        'parts': [
          {'text': 'Understood! I am ParkBot — I can search parkings, book slots, cancel reservations, process wallet payments, and check all your data. How can I help?'}
        ]
      },
      ...history.take(6).map((m) {
        return {
          'role': m.isUser ? 'user' : 'model',
          'parts': [{'text': m.content}]
        };
      }),
      {
        'role': 'user',
        'parts': [{'text': fullMsg}]
      },
    ];
  }

  // ─── Action parsing ────────────────────────────────────────

  static ({String cleanText, List<Map<String, dynamic>> actions}) parseActions(String text) {
    final actions = <Map<String, dynamic>>[];
    final cleanText = text.replaceAllMapped(
      RegExp(r'```action\s*\n?([\s\S]*?)```'),
      (match) {
        try {
          final action = jsonDecode(match.group(1)!.trim()) as Map<String, dynamic>;
          if (action.containsKey('type')) actions.add(action);
        } catch (_) {}
        return '';
      },
    ).trim();
    return (cleanText: cleanText, actions: actions);
  }

  // ─── Action execution ──────────────────────────────────────

  Future<({bool success, String message})> executeAction(Map<String, dynamic> action) async {
    try {
      final type = action['type'] as String;

      if (type == 'reserve') {
        final slotId = action['parkingSlotId'] as int?;
        final start = action['startTime'] as String?;
        final end = action['endTime'] as String?;
        if (slotId == null || start == null || end == null) {
          return (success: false, message: '❌ Missing reservation data.');
        }
        final plateRaw = action['vehiclePlate'];
        if (plateRaw is! String || plateRaw.trim().isEmpty) {
          return (
            success: false,
            message:
                '❌ Vehicle plate is required. Ask the user for their license plate, then run reserve again with **vehiclePlate** in the action JSON.',
          );
        }
        final trimmed = plateRaw.trim();
        if (!isValidVehiclePlate(trimmed)) {
          return (
            success: false,
            message:
                '❌ Invalid vehicle plate. Use at least 4 letters or digits (spaces and dashes are fine).',
          );
        }
        final r = await reservationService.createReservation(
          parkingSlotId: slotId,
          startTime: DateTime.parse(start),
          endTime: DateTime.parse(end),
          vehiclePlate: trimmed,
        );
        return (
          success: true,
          message:
              '✅ **Reservation created!**\n\n- Parking: ${r.parkingName}\n- Slot: ${r.slotNumber}\n- Time: ${r.startTime} → ${r.endTime}\n- Cost: ${r.totalPrice} MAD\n- Status: ${r.status}\n\n💳 Say **"pay"** to pay with your wallet!'
        );
      }

      if (type == 'cancel') {
        final resId = action['reservationId'] as int?;
        if (resId == null) {
          return (success: false, message: '❌ Missing reservation ID.');
        }
        final r = await reservationService.cancelReservation(resId);
        return (
          success: true,
          message: '✅ **Reservation #${r.id} cancelled.**\n- Parking: ${r.parkingName}\n- Slot: ${r.slotNumber}\n- Status: ${r.status}'
        );
      }

      if (type == 'pay') {
        final resId = action['reservationId'] as int?;
        if (resId == null) {
          return (success: false, message: '❌ Missing reservation ID.');
        }
        final w = await walletService.payForReservation(resId);
        return (
          success: true,
          message: '✅ **Payment successful!**\n- Reservation #$resId is now **PAID** 🎉\n- Remaining balance: **${w.balance} MAD**'
        );
      }

      return (success: false, message: '❌ Unknown action type.');
    } catch (e) {
      String msg = 'Action failed';
      if (e is DioException) {
        final data = e.response?.data;
        if (data is Map) msg = data['message'] as String? ?? msg;
      }
      return (success: false, message: '❌ **Action failed:** $msg');
    }
  }

  // ─── Streaming API call ────────────────────────────────────

  Future<String> sendMessage(
    String userMessage,
    List<ChatMessage> history, {
    void Function(String partial)? onChunk,
  }) async {
    final ctx = await _fetchLiveContext(userMessage);
    lastContext = ctx;
    final contextBlock = _buildContextBlock(ctx);
    final contents = _buildContents(userMessage, history, contextBlock);

    final payload = {
      'contents': contents,
      'generationConfig': {
        'temperature': 0.7,
        'maxOutputTokens': 1000,
        'thinkingConfig': {'thinkingBudget': 0},
      },
    };

    Exception? lastError;

    for (final model in _orderedModels) {
      // Attempt 1: non-streaming (2.5 models only support generateContent)
      try {
        debugPrint('[ParkBot] Trying $model (non-stream)…');
        final result = await _tryNonStreaming(model, payload);
        _lastWorkingModel = model;
        onChunk?.call(result);
        return result;
      } on _RateLimitException {
        debugPrint('[ParkBot] $model non-stream → 429, trying stream…');
      } catch (e) {
        if (e is Exception && e.toString().contains('API_KEY_INVALID')) rethrow;
        debugPrint('[ParkBot] $model non-stream error: $e');
        lastError = e is Exception ? e : Exception(e.toString());
        continue;
      }

      // Attempt 2: streaming fallback (works for 2.0 models)
      try {
        debugPrint('[ParkBot] Trying $model (stream)…');
        final result = await _tryStreaming(model, payload, onChunk);
        _lastWorkingModel = model;
        return result;
      } on _RateLimitException catch (e) {
        debugPrint('[ParkBot] $model stream → 429');
        lastError = e;
        await Future.delayed(const Duration(seconds: 2));
        continue;
      } catch (e) {
        debugPrint('[ParkBot] $model stream error: $e');
        lastError = e is Exception ? e : Exception(e.toString());
        continue;
      }
    }

    throw lastError ?? Exception('RATE_LIMITED');
  }

  Future<String> _tryStreaming(
    String model,
    Map<String, dynamic> payload,
    void Function(String partial)? onChunk,
  ) async {
    final response = await _dio.post<ResponseBody>(
      _geminiUrl(model, stream: true),
      data: jsonEncode(payload),
      options: Options(
        headers: {'Content-Type': 'application/json'},
        responseType: ResponseType.stream,
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    if (response.statusCode == 429) throw _RateLimitException();
    if (response.statusCode == 403) throw Exception('API_KEY_INVALID');
    if (response.statusCode == 400) throw Exception('BAD_REQUEST');
    if (response.statusCode != 200) throw Exception('GEMINI_${response.statusCode}');

    final stream = response.data!.stream;
    final fullText = StringBuffer();
    String buffer = '';
    final transformer = StreamTransformer<Uint8List, String>.fromHandlers(
      handleData: (data, sink) => sink.add(utf8.decode(data)),
    );

    await for (final chunk in stream.transform(transformer)) {
      buffer += chunk;
      final lines = buffer.split('\n');
      buffer = lines.removeLast();

      for (final line in lines) {
        if (!line.startsWith('data: ')) continue;
        final jsonStr = line.substring(6).trim();
        if (jsonStr.isEmpty || jsonStr == '[DONE]') continue;
        try {
          final parsed = jsonDecode(jsonStr) as Map<String, dynamic>;
          final candidates = parsed['candidates'] as List?;
          if (candidates != null && candidates.isNotEmpty) {
            final parts = (candidates[0] as Map)['content']?['parts'] as List?;
            if (parts != null && parts.isNotEmpty) {
              final text = parts[0]['text'] as String?;
              if (text != null) {
                fullText.write(text);
                final display = fullText.toString().replaceAll(RegExp(r'```action[\s\S]*$'), '').trim();
                onChunk?.call(display.isEmpty ? '…' : display);
              }
            }
          }
        } catch (_) {}
      }
    }

    final result = fullText.toString();
    if (result.isEmpty) throw Exception('EMPTY_RESPONSE');
    return result;
  }

  Future<String> _tryNonStreaming(
    String model,
    Map<String, dynamic> payload,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      _geminiUrl(model, stream: false),
      data: jsonEncode(payload),
      options: Options(
        headers: {'Content-Type': 'application/json'},
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    if (response.statusCode == 429) throw _RateLimitException();
    if (response.statusCode == 403) throw Exception('API_KEY_INVALID');
    if (response.statusCode == 400) throw Exception('BAD_REQUEST');
    if (response.statusCode != 200) throw Exception('GEMINI_${response.statusCode}');

    final data = response.data!;
    final candidates = data['candidates'] as List?;
    if (candidates == null || candidates.isEmpty) throw Exception('EMPTY_RESPONSE');
    final parts = (candidates[0] as Map)['content']?['parts'] as List?;
    if (parts == null || parts.isEmpty) throw Exception('EMPTY_RESPONSE');
    // 2.5 models may include a "thought" part before the actual text
    final textParts = parts
        .where((p) => p is Map && p['text'] != null && (p['thought'] != true))
        .map((p) => p['text'] as String)
        .toList();
    final text = textParts.isNotEmpty ? textParts.join() : (parts.last['text'] as String?);
    if (text == null || text.isEmpty) throw Exception('EMPTY_RESPONSE');
    return text;
  }
}

class _RateLimitException implements Exception {
  @override
  String toString() => 'RATE_LIMITED';
}

// ─── Quick prompts ──────────────────────────────────────────

class QuickPrompt {
  final String label;
  final String icon;
  final String text;
  const QuickPrompt({required this.label, required this.icon, required this.text});
}

const quickPrompts = [
  QuickPrompt(label: 'Book parking', icon: '🚗', text: 'I want to reserve a parking spot'),
  QuickPrompt(label: 'Available spots', icon: '🅿️', text: 'Show available parkings with free slots'),
  QuickPrompt(label: 'My reservations', icon: '📋', text: 'Show all my reservations'),
  QuickPrompt(label: 'Pay reservation', icon: '💳', text: 'Pay for my latest reservation'),
  QuickPrompt(label: 'Wallet balance', icon: '💰', text: 'What is my wallet balance?'),
  QuickPrompt(label: 'Cancel booking', icon: '❌', text: 'I want to cancel a reservation'),
];
