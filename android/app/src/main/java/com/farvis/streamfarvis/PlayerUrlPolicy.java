package com.farvis.streamfarvis;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Exact hosts only: untrusted providers never become a route into the app bridge. */
final class PlayerUrlPolicy {
    private static final Set<String> PLAYER_HOSTS = new HashSet<>(Arrays.asList(
        "player.videasy.to", "player.videasy.net", "vsembed.su",
        "vidsrc-embed.ru", "vidsrcme.ru", "vidsrcme.su", "vidsrc-embed.su",
        "vidking.net", "www.vidking.net"
    ));

    private PlayerUrlPolicy() {}

    static boolean isPlayerUrl(String value) {
        URI uri = parseWebUrl(value);
        return uri != null
            && "https".equalsIgnoreCase(uri.getScheme())
            && (uri.getPort() == -1 || uri.getPort() == 443)
            && PLAYER_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT));
    }

    static boolean isExternalUrl(String value) {
        return parseWebUrl(value) != null;
    }

    static boolean isEmbeddedUrl(String value) {
        if ("about:blank".equals(value)) return true;
        URI uri = parseWebUrl(value);
        return uri != null && "https".equalsIgnoreCase(uri.getScheme());
    }

    private static URI parseWebUrl(String value) {
        if (value == null || value.length() > 8192) return null;
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (!("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))) return null;
            if (uri.getHost() == null || uri.getRawUserInfo() != null) return null;
            return uri;
        } catch (URISyntaxException exception) {
            return null;
        }
    }
}
