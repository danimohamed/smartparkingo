import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../generated/l10n/app_localizations.dart';
import '../providers/locale_provider.dart';

/// Drop-in language switcher for any settings/profile screen.
///
/// Uses [LocaleProvider] to persist the choice and rebuild the whole app
/// with the new locale. Falls back to French gracefully.
class LanguagePicker extends StatelessWidget {
  const LanguagePicker({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final localeProv = context.watch<LocaleProvider>();

    final entries = <_LangEntry>[
      _LangEntry('fr', l10n.languageFrench, '🇫🇷'),
      _LangEntry('en', l10n.languageEnglish, '🇬🇧'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            l10n.settingsLanguageTitle,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        ...entries.map(
          (e) => RadioListTile<String>(
            value: e.code,
            groupValue: localeProv.locale.languageCode,
            onChanged: (v) {
              if (v != null) localeProv.setLocale(Locale(v));
            },
            title: Text('${e.flag}  ${e.label}'),
          ),
        ),
      ],
    );
  }
}

class _LangEntry {
  final String code;
  final String label;
  final String flag;
  const _LangEntry(this.code, this.label, this.flag);
}

