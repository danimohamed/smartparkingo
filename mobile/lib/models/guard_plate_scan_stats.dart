class GuardPlateScanStats {
  final int appUsersToday;
  final int nonAppUsersToday;

  const GuardPlateScanStats({
    required this.appUsersToday,
    required this.nonAppUsersToday,
  });

  factory GuardPlateScanStats.fromJson(Map<String, dynamic> json) {
    return GuardPlateScanStats(
      appUsersToday: (json['appUsersToday'] as num?)?.toInt() ?? 0,
      nonAppUsersToday: (json['nonAppUsersToday'] as num?)?.toInt() ?? 0,
    );
  }
}

