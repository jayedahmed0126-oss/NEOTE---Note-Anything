// auth_integration_logic.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'user_model.dart';
import 'firebase_service.dart';

class AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseService _dbService = FirebaseService();

  /// Handle User Registration & immediate Firestore initialization
  Future<UserCredential?> signUpWithEmailAndPassword({
    required String accountName,
    required String email,
    required String password,
    required String phoneNumber,
    required String gender,
    required String address,
  }) async {
    try {
      print('--- AUTH SIGNUP ATTEMPT ---');
      print('Email: $email');

      // 1. Authenticate with Firebase Authentication
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final User? firebaseUser = userCredential.user;

      if (firebaseUser != null) {
        print('Authentication credentials created successfully! UID: ${firebaseUser.uid}');

        // 2. Fetch runtime device parameters
        final LoginDeviceInfo deviceInfo = await _dbService.getDeviceInformation();

        // 3. Map values to our custom UserModel
        final UserModel newUser = UserModel(
          uid: firebaseUser.uid,
          accountName: accountName.trim(),
          email: firebaseUser.email ?? email.trim(),
          phoneNumber: phoneNumber.trim(),
          gender: gender,
          address: address.trim(),
          country: 'Bangladesh', // Standard requested default
          coinBalance: 343,      // Premium Clip budget
          ownedThemes: ['emerald_green', 'electric_neon_red'], // Default equipped starter themes
          activeTheme: 'emerald_green',
          loginDevice: deviceInfo,
        );

        // 4. Fire immediate write into Cloud Firestore database (uses UID as doc ID)
        await _dbService.createNewUserInFirestore(newUser);

        print('Full account setup complete for: $accountName');
        return userCredential;
      }
    } on FirebaseAuthException catch (e) {
      print('AUTHENTICATION ERROR [FirebaseAuthException]:');
      print('Error Code: ${e.code}');
      print('Error Message: ${e.message}');
      rethrow;
    } catch (e) {
      print('GENERAL EXCEPTION during signup workflow: $e');
      rethrow;
    }
    return null;
  }
}
