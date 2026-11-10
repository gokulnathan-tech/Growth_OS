package com.kanitree.planner;

import androidx.fragment.app.FragmentActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;

@CapacitorPlugin(name = "BiometricAuth")
public class BiometricAuthPlugin extends Plugin {
    private int authenticators() {
        return BiometricManager.Authenticators.BIOMETRIC_STRONG
                | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        int result = BiometricManager.from(getContext()).canAuthenticate(authenticators());
        JSObject response = new JSObject();
        response.put("available", result == BiometricManager.BIOMETRIC_SUCCESS);
        if (result != BiometricManager.BIOMETRIC_SUCCESS) {
            response.put("message", "Device biometric or screen-lock authentication is not configured or available.");
        }
        call.resolve(response);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        // BiometricPrompt creates/updates a Fragment internally, so ALL prompt
        // construction and authenticate() calls must run on the Activity UI thread.
        final android.app.Activity hostActivity = getActivity();
        if (hostActivity == null) {
            call.reject("Admin authentication is unavailable right now. Please use password login.");
            return;
        }

        hostActivity.runOnUiThread(() -> {
            if (!(hostActivity instanceof FragmentActivity)) {
                call.reject("Admin authentication is unavailable right now. Please use password login.");
                return;
            }
            FragmentActivity activity = (FragmentActivity) hostActivity;
            if (activity.isFinishing() || activity.isDestroyed()) {
                call.reject("The app is closing. Please try fingerprint verification again.");
                return;
            }

            Executor executor = ContextCompat.getMainExecutor(activity);
            BiometricPrompt prompt = new BiometricPrompt(activity, executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                        JSObject response = new JSObject();
                        response.put("verified", true);
                        call.resolve(response);
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, CharSequence errString) {
                        call.reject(errString == null ? "Authentication cancelled." : errString.toString());
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        // Keep the native prompt open so the user can retry.
                    }
                });

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Growth_OS Admin Verification")
                .setSubtitle("Verify fingerprint or device screen lock")
                .setAllowedAuthenticators(authenticators())
                .build();

            prompt.authenticate(promptInfo);
        });
    }
}
