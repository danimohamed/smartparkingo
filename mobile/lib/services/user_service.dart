import '../models/user.dart';
import '../utils/constants.dart';
import 'dio_client.dart';

class UserService {
  final DioClient _client = DioClient();

  Future<User> getMe() async {
    final response = await _client.dio.get(ApiConstants.currentUser);
    final data = response.data;
    final map = data is Map<String, dynamic> && data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return User.fromJson(map);
  }

  Future<User> updateDefaultVehiclePlate(String? plate) async {
    final response = await _client.dio.put(
      ApiConstants.updateDefaultVehiclePlate,
      data: {'defaultVehiclePlate': plate ?? ''},
    );
    final data = response.data;
    final map = data is Map<String, dynamic> && data.containsKey('data')
        ? data['data'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return User.fromJson(map);
  }
}
