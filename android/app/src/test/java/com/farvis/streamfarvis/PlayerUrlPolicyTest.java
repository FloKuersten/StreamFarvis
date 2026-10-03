package com.farvis.streamfarvis;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

public class PlayerUrlPolicyTest {
    @Test
    public void currentProviderMovieAndEpisodeLinksAreAccepted() {
        String[] allowed = {
            "https://player.videasy.to/movie/550?color=ff5500",
            "https://vsembed.su/embed/tv/1/2/3?ds_lang=en",
            "https://www.vidking.net/embed/movie/550?autoPlay=true",
            "https://PLAYER.VIDEASY.TO:443/movie/550",
            "https://vidsrc-embed.ru/embed/movie/550"
        };
        for (String url : allowed) assertTrue(url, PlayerUrlPolicy.isPlayerUrl(url));
    }

    @Test
    public void untrustedNavigationCannotSpoofAProviderOrOpenLocalFiles() {
        String[] blocked = {
            null, "", "http://www.vidking.net/embed/movie/550",
            "https://www.vidking.net.evil.example/embed/movie/550",
            "https://evil.example/?https://www.vidking.net/",
            "https://evil@www.vidking.net/embed/movie/550",
            "https://www.vidking.net@evil.example/embed/movie/550",
            "https://www.vidking.net:8080/embed/movie/550",
            "https://www.vidking.net\\@evil.example/", "https://www.vidking.net./",
            "file:///etc/passwd", "javascript:alert(1)", "intent://www.vidking.net/",
            "https://localhost/", "https://127.0.0.1/", "https://www.vidking.net/\n"
        };
        for (String url : blocked) assertFalse(String.valueOf(url), PlayerUrlPolicy.isPlayerUrl(url));
    }

    @Test
    public void nestedHttpsFramesWorkWithoutPermittingCustomSchemes() {
        assertTrue(PlayerUrlPolicy.isEmbeddedUrl("https://nested-cdn.example/embed"));
        assertTrue(PlayerUrlPolicy.isEmbeddedUrl("about:blank"));
        assertFalse(PlayerUrlPolicy.isEmbeddedUrl("intent://nested-cdn.example/"));
        assertFalse(PlayerUrlPolicy.isEmbeddedUrl("http://nested-cdn.example/"));
    }

    @Test
    public void externalBrowserLinksAreLimitedToWebAddresses() {
        assertTrue(PlayerUrlPolicy.isExternalUrl("https://www.themoviedb.org/"));
        assertFalse(PlayerUrlPolicy.isExternalUrl("javascript:alert(1)"));
        assertFalse(PlayerUrlPolicy.isExternalUrl("file:///sdcard/private"));
    }
}
