/// One religious day (Diyanet calendar).
class ReligiousDay {
  const ReligiousDay({required this.date, required this.name});

  final String date; // YYYY-MM-DD
  final String name;
}

/// Explanation for a religious day (detail modal).
class ReligiousDayExplanation {
  const ReligiousDayExplanation({
    required this.name,
    required this.description,
    required this.significance,
  });

  final String name;
  final String description;
  final String significance;
}
