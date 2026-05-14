export function normalizeVehiclePlate(raw) {
    if (!raw || typeof raw !== 'string') return ''

    const mapArabic = (ch) => {
        switch (ch) {
            case 'أ':
            case 'ا':
            case 'إ':
            case 'آ':
                return 'A'
            case 'ب':
                return 'B'
            case 'ت':
                return 'T'
            case 'ث':
                return 'V'
            case 'ج':
                return 'J'
            case 'ح':
                return 'H'
            case 'خ':
                return 'X'
            case 'د':
                return 'D'
            case 'ذ':
            case 'ز':
                return 'Z'
            case 'ر':
                return 'R'
            case 'س':
                return 'S'
            case 'ش':
                return '$'
            case 'ص':
                return 'S'
            case 'ض':
                return 'D'
            case 'ط':
                return 'T'
            case 'ظ':
                return 'Z'
            case 'ع':
                return 'E'
            case 'غ':
                return 'G'
            case 'ف':
                return 'F'
            case 'ق':
                return 'Q'
            case 'ك':
                return 'K'
            case 'ل':
                return 'L'
            case 'م':
                return 'M'
            case 'ن':
                return 'N'
            case 'ه':
                return 'H'
            case 'و':
                return 'W'
            case 'ي':
                return 'Y'
            default:
                return ''
        }
    }

    const up = raw.toUpperCase()
    let out = ''
    for (const ch of up) {
        const mapped = mapArabic(ch)
        if (mapped) {
            out += mapped
            continue
        }
        if (/[A-Z0-9]/.test(ch)) out += ch
    }
    return out
}

