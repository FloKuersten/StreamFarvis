package com.farvis.streamfarvis;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

@CapacitorPlugin(name = "StreamFarvis")
public class StreamFarvisPlugin extends Plugin {
    private static final String KEY_ALIAS = "com.farvis.streamfarvis.storage.v1";
    private static final String PREFERENCES = "streamfarvis_secure_v1";
    private final Object storageLock = new Object();

    @PluginMethod
    public void secureGet(PluginCall call) {
        String key = validKey(call);
        if (key == null) return;
        try {
            String value;
            synchronized (storageLock) {
                String encoded = preferences().getString(key, null);
                value = encoded == null ? null : decrypt(key, encoded);
            }
            JSObject result = new JSObject();
            result.put("value", value == null ? JSONObject.NULL : value);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Could not read secure storage. Save your API key again.", "STORAGE_READ_FAILED");
        }
    }

    @PluginMethod
    public void secureSet(PluginCall call) {
        String key = validKey(call);
        if (key == null) return;
        if (!call.getData().has("value")) {
            call.reject("A string value or null is required.", "INVALID_VALUE");
            return;
        }
        boolean remove = call.getData().isNull("value");
        String value = call.getString("value");
        if (!remove && (value == null || value.getBytes(StandardCharsets.UTF_8).length > 65536)) {
            call.reject("Secure storage values must be strings no larger than 64 KiB.", "INVALID_VALUE");
            return;
        }
        try {
            synchronized (storageLock) {
                SharedPreferences.Editor editor = preferences().edit();
                if (remove) editor.remove(key);
                else editor.putString(key, encrypt(key, value));
                if (!editor.commit()) throw new IllegalStateException("Storage write failed");
            }
            call.resolve();
        } catch (Exception exception) {
            call.reject("Could not save to secure storage. Please try again.", "STORAGE_WRITE_FAILED");
        }
    }

    @PluginMethod
    public void openExternal(PluginCall call) {
        String url = call.getString("url");
        if (!PlayerUrlPolicy.isExternalUrl(url)) {
            call.reject("Only HTTP or HTTPS web links can be opened.", "INVALID_URL");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (ActivityNotFoundException exception) {
                call.reject("No browser is installed to open this link.", "BROWSER_UNAVAILABLE");
            } catch (Exception exception) {
                call.reject("This web link could not be opened.", "BROWSER_UNAVAILABLE");
            }
        });
    }

    @PluginMethod
    public void openPlayer(PluginCall call) {
        String url = call.getString("url");
        if (!PlayerUrlPolicy.isPlayerUrl(url)) {
            call.reject("This playback address is not a supported HTTPS provider.", "INVALID_PLAYER_URL");
            return;
        }
        String title = call.getString("title", "Player");
        String safeTitle = title.length() > 200 ? title.substring(0, 200) : title;
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(getActivity(), PlayerActivity.class);
                intent.putExtra(PlayerActivity.EXTRA_URL, url);
                intent.putExtra(PlayerActivity.EXTRA_TITLE, safeTitle);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception exception) {
                call.reject("The Android player could not be opened.", "PLAYER_UNAVAILABLE");
            }
        });
    }

    private String validKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || !key.matches("[A-Za-z0-9_.-]{1,128}")) {
            call.reject("A valid secure storage key is required.", "INVALID_KEY");
            return null;
        }
        return key;
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    private SecretKey secretKey(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return (SecretKey) store.getKey(KEY_ALIAS, null);
        if (!create) throw new GeneralSecurityException("Encryption key unavailable");
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
            KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }

    private String encrypt(String key, String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey(true));
        cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        return "1." + Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)
            + "." + Base64.encodeToString(encrypted, Base64.NO_WRAP);
    }

    private String decrypt(String key, String encoded) throws Exception {
        String[] parts = encoded.split("\\.", -1);
        if (parts.length != 3 || !"1".equals(parts[0])) throw new GeneralSecurityException("Invalid record");
        byte[] iv = Base64.decode(parts[1], Base64.NO_WRAP);
        if (iv.length != 12) throw new GeneralSecurityException("Invalid nonce");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey(false), new GCMParameterSpec(128, iv));
        cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
        return new String(cipher.doFinal(Base64.decode(parts[2], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }
}
