import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/base_api_service.dart';

class _Parser with ApiResponseParser {}

void main() {
  final parser = _Parser();

  group('extractObject', () {
    test('unwraps ApiResponse envelope', () {
      final result = parser.extractObject({
        'success': true,
        'message': 'OK',
        'data': {'id': 1, 'name': 'Lot A'},
      });
      expect(result, {'id': 1, 'name': 'Lot A'});
    });

    test('returns the map as-is when no envelope', () {
      final raw = {'id': 9, 'foo': 'bar'};
      expect(parser.extractObject(raw), raw);
    });

    test('returns empty map for null / wrong shape', () {
      expect(parser.extractObject(null), <String, dynamic>{});
      expect(parser.extractObject('oops'), <String, dynamic>{});
    });
  });

  group('extractList', () {
    test('unwraps a list inside ApiResponse envelope', () {
      final result = parser.extractList({
        'success': true,
        'data': [
          {'id': 1},
          {'id': 2},
        ],
      });
      expect(result, hasLength(2));
      expect(result.first['id'], 1);
    });

    test('returns the list as-is when already a list', () {
      final raw = [
        {'id': 1},
      ];
      expect(parser.extractList(raw), raw);
    });

    test('returns [] for null / wrong shape', () {
      expect(parser.extractList(null), isEmpty);
      expect(parser.extractList(42), isEmpty);
    });
  });
}

