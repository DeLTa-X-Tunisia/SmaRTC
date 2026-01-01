class LoginModel {
  final String username;
  final String password;

  LoginModel({required this.username, required this.password});

  Map<String, dynamic> toJson() {
    return {'username': username, 'password': password};
  }
}

class RegisterModel {
  final String username;
  final String password;
  final String? role;

  RegisterModel({required this.username, required this.password, this.role});

  Map<String, dynamic> toJson() {
    return {'username': username, 'password': password, 'role': role};
  }
}

class LoginResponse {
  final String token;

  LoginResponse({required this.token});

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(token: json['token'] as String);
  }
}
