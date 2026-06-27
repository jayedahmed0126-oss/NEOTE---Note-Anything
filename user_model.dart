// user_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String accountName;
  final String email;
  final String phoneNumber;
  final String gender;
  final String address;
  final String country;
  final int coinBalance;
  final List<String> ownedThemes;
  final String activeTheme;
  final LoginDeviceInfo loginDevice;

  UserModel({
    required this.uid,
    required this.accountName,
    required this.email,
    required this.phoneNumber,
    required this.gender,
    required this.address,
    this.country = 'Bangladesh',
    this.coinBalance = 343, // Default or initial value
    required this.ownedThemes,
    required this.activeTheme,
    required this.loginDevice,
  });

  // Convert UserModel to a Map/JSON structure for Cloud Firestore writes
  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'accountName': accountName,
      'email': email,
      'phoneNumber': phoneNumber,
      'gender': gender,
      'address': address,
      'country': country,
      'coinBalance': coinBalance,
      'ownedThemes': ownedThemes,
      'activeTheme': activeTheme,
      'loginDevice': loginDevice.toMap(),
    };
  }

  // Create a UserModel from a Map/JSON structure read from Cloud Firestore
  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] ?? '',
      accountName: map['accountName'] ?? '',
      email: map['email'] ?? '',
      phoneNumber: map['phoneNumber'] ?? '',
      gender: map['gender'] ?? '',
      address: map['address'] ?? '',
      country: map['country'] ?? 'Bangladesh',
      coinBalance: map['coinBalance'] is int ? map['coinBalance'] : (map['coinBalance'] as num?)?.toInt() ?? 0,
      ownedThemes: List<String>.from(map['ownedThemes'] ?? []),
      activeTheme: map['activeTheme'] ?? '',
      loginDevice: LoginDeviceInfo.fromMap(map['loginDevice'] ?? {}),
    );
  }
}

class LoginDeviceInfo {
  final String deviceName;
  final String deviceModel;
  final String osVersion;
  final DateTime lastLoginTimestamp;

  LoginDeviceInfo({
    required this.deviceName,
    required this.deviceModel,
    required this.osVersion,
    required this.lastLoginTimestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'deviceName': deviceName,
      'deviceModel': deviceModel,
      'osVersion': osVersion,
      'lastLoginTimestamp': Timestamp.fromDate(lastLoginTimestamp),
    };
  }

  factory LoginDeviceInfo.fromMap(Map<dynamic, dynamic> map) {
    DateTime parsedTime;
    if (map['lastLoginTimestamp'] is Timestamp) {
      parsedTime = (map['lastLoginTimestamp'] as Timestamp).toDate();
    } else if (map['lastLoginTimestamp'] is String) {
      parsedTime = DateTime.parse(map['lastLoginTimestamp']);
    } else {
      parsedTime = DateTime.now();
    }

    return LoginDeviceInfo(
      deviceName: map['deviceName'] ?? 'Unknown Device',
      deviceModel: map['deviceModel'] ?? 'Unknown Model',
      osVersion: map['osVersion'] ?? 'Unknown OS',
      lastLoginTimestamp: parsedTime,
    );
  }
}
