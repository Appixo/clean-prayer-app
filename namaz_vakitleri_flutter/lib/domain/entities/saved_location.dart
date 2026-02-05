import 'package:equatable/equatable.dart';

class SavedLocation extends Equatable {
  const SavedLocation({
    required this.id,
    required this.city,
    required this.country,
    required this.latitude,
    required this.longitude,
  });

  final String id;
  final String city;
  final String country;
  final double latitude;
  final double longitude;

  Map<String, dynamic> toJson() => {
        'id': id,
        'city': city,
        'country': country,
        'latitude': latitude,
        'longitude': longitude,
      };

  factory SavedLocation.fromJson(Map<String, dynamic> json) => SavedLocation(
        id: json['id'] as String,
        city: json['city'] as String,
        country: json['country'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
      );

  @override
  List<Object?> get props => [id, city, country, latitude, longitude];
}
