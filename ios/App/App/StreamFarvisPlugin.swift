import Foundation
import Capacitor
import UIKit
import WebKit

@objc(StreamFarvisPlugin)
public class StreamFarvisPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StreamFarvisPlugin"
    public let jsName = "StreamFarvis"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "secureGet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "secureSet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openExternal", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPlayer", returnType: CAPPluginReturnPromise)
    ]

    private let service = "com.farvis.streamfarvis.keychain"

    @objc func secureGet(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("A storage key is required.", "INVALID_KEY")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) {
            call.resolve(["value": value])
        } else if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
        } else {
            call.reject("Could not read secure storage.", "STORAGE_READ_FAILED")
        }
    }

    @objc func secureSet(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("A storage key is required.", "INVALID_KEY")
            return
        }

        if call.options["value"] == nil || call.options["value"] is NSNull {
            let deleteQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key
            ]
            SecItemDelete(deleteQuery as CFDictionary)
            call.resolve()
            return
        }

        guard let value = call.getString("value") else {
            call.reject("A string value or null is required.", "INVALID_VALUE")
            return
        }

        guard let data = value.data(using: .utf8), data.count <= 65536 else {
            call.reject("Secure storage values must be strings no larger than 64 KiB.", "INVALID_VALUE")
            return
        }

        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        if status == errSecSuccess {
            call.resolve()
        } else {
            call.reject("Could not save to secure storage.", "STORAGE_WRITE_FAILED")
        }
    }

    @objc func openExternal(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString),
              let scheme = url.scheme?.lowercased(),
              ["http", "https"].contains(scheme) else {
            call.reject("Only HTTP or HTTPS web links can be opened.", "INVALID_URL")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("This web link could not be opened.", "BROWSER_UNAVAILABLE")
                }
            }
        }
    }

    @objc func openPlayer(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), !urlString.isEmpty,
              let url = URL(string: urlString) else {
            call.reject("A valid playback address is required.", "INVALID_URL")
            return
        }

        let title = call.getString("title") ?? "StreamFarvis Player"

        DispatchQueue.main.async { [weak self] in
            guard let self = self, let bridge = self.bridge, let presenter = bridge.viewController else {
                call.reject("Player could not be presented.", "VIEW_CONTROLLER_MISSING")
                return
            }

            let playerVC = PlayerViewController(playerUrl: url, playerTitle: title)
            playerVC.modalPresentationStyle = .fullScreen
            presenter.present(playerVC, animated: true) {
                call.resolve()
            }
        }
    }
}
