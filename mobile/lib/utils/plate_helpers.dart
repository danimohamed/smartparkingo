String _mapArabicLetter(String ch) {
  switch (ch) {
    case 'أ':
    case 'ا':
    case 'إ':
    case 'آ':
      return 'A';
    case 'ب':
      return 'B';
    case 'ت':
      return 'T';
    case 'ث':
      return 'V';
    case 'ج':
      return 'J';
    case 'ح':
      return 'H';
    case 'خ':
      return 'X';
    case 'د':
      return 'D';
    case 'ذ':
    case 'ز':
      return 'Z';
    case 'ر':
      return 'R';
    case 'س':
      return 'S';
    case 'ش':
      return r'$';
    case 'ص':
      return 'S';
    case 'ض':
      return 'D';
    case 'ط':
      return 'T';
    case 'ظ':
      return 'Z';
    case 'ع':
      return 'E';
    case 'غ':
      return 'G';
    case 'ف':
      return 'F';
    case 'ق':
      return 'Q';
    case 'ك':
      return 'K';
    case 'ل':
      return 'L';
    case 'م':
      return 'M';
    case 'ن':
      return 'N';
    case 'ه':
      return 'H';
    case 'و':
      return 'W';
    case 'ي':
      return 'Y';
    default:
      return '';
  }
}

/// Aligns with backend [PlateNormalizer] (keeps letters/digits; maps Moroccan Arabic letters).
String normalizeVehiclePlate(String raw) {
  final up = raw.toUpperCase();
  final out = StringBuffer();
  for (final rune in up.runes) {
    final ch = String.fromCharCode(rune);
    final mapped = _mapArabicLetter(ch);
    if (mapped.isNotEmpty) {
      out.write(mapped);
      continue;
    }
    if (RegExp(r'[A-Z0-9]').hasMatch(ch)) out.write(ch);
  }
  return out.toString();
}

bool isValidVehiclePlate(String raw) {
  final n = normalizeVehiclePlate(raw);
  return n.length >= 4 && n.length <= 64;
}
