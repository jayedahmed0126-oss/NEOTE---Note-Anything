// firebase_service.dart
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'user_model.dart';

class FirebaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Creates or updates a user document in Cloud Firestore under the `users/{uid}` path.
  /// Standard production pattern ensures users can only write to their own matching UID.
  Future<void> createNewUserInFirestore(UserModel user) async {
    try {
      print('--- FIRESTORE INITIATION START ---');
      print('Document Path: users/${user.uid}');
      print('Target Fields Count: ${user.toMap().length}');
      
      // Perform write to Firebase Firestore
      await _db.collection('users').doc(user.uid).set(
            user.toMap(),
            SetOptions(merge: true),
          );

      print('SUCCESS: User document created successfully in Firestore database!');
    } on FirebaseException catch (e) {
      print('DATABASE ERROR [FirebaseException]: Failed to write user profile.');
      print('Error Code: ${e.code}');
      print('Error Message: ${e.message}');
      print('Check security rules if permission is denied.');
      rethrow;
    } catch (e) {
      print('UNKNOWN ERROR: An unexpected error occurred during database write.');
      print('Details: $e');
      rethrow;
    } finally {
      print('--- FIRESTORE INITIATION COMPLETE ---');
    }
  }

  /// Helper to collect active device info in Flutter
  Future<LoginDeviceInfo> getDeviceInformation() async {
    // Standard default fallback values
    String deviceName = 'Simulator/Web';
    String deviceModel = 'Generic Model';
    String osVersion = Platform.operatingSystem;

    try {
      // Typically use package:device_info_plus to load real device parameters
      // e.g. DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      // On Android: AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      // On iOS: IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
    } catch (e) {
      print('Device info plugin not ready, using hardware fallback values: $e');
    }

    return LoginDeviceInfo(
      deviceName: deviceName,
      deviceModel: deviceModel,
      osVersion: osVersion,
      lastLoginTimestamp: DateTime.now(),
    );
  }
}
