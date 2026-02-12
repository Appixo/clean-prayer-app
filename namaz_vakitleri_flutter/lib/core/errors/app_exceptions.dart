/// App-wide exceptions. Extend when adding API or domain errors.
library;

class AppException implements Exception {
  AppException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => 'AppException: $message${cause != null ? ' (cause: $cause)' : ''}';
}
