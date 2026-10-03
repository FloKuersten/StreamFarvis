package com.farvis.streamfarvis;

import android.annotation.SuppressLint;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.util.Collections;

/**
 * Provider pages live in a plain WebView, never in Capacitor's trusted WebView.
 * This activity deliberately has no addJavascriptInterface or native message bridge.
 */
public class PlayerActivity extends ComponentActivity {
    static final String EXTRA_URL = "playerUrl";
    static final String EXTRA_TITLE = "playerTitle";
    private static final int BACKGROUND = Color.rgb(9, 11, 16);
    private static final int ACCENT = Color.rgb(229, 9, 20);
    private static final String PAUSE_MEDIA_SCRIPT =
        "(function(){window.addEventListener('message',function(event){"
        + "if(event.data!=='streamfarvis:pause-media')return;"
        + "document.querySelectorAll('video,audio').forEach(function(m){m.pause();});"
        + "for(var i=0;i<window.frames.length;i++){"
        + "window.frames[i].postMessage('streamfarvis:pause-media','*');}"
        + "});})();";

    private FrameLayout root;
    private LinearLayout page;
    private FrameLayout playerContainer;
    private ProgressBar progress;
    private LinearLayout errorPanel;
    private TextView errorText;
    private WebView webView;
    private String playerUrl;
    private View customView;
    private FrameLayout fullscreenContainer;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private int previousOrientation;
    private boolean pageFailed;
    private boolean destroying;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        playerUrl = getIntent().getStringExtra(EXTRA_URL);
        if (!PlayerUrlPolicy.isPlayerUrl(playerUrl)) {
            Toast.makeText(this, "This playback address is not supported.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        createLayout();
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, windowInsets) -> {
            Insets safe = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(root);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                handleBack();
            }
        });
        loadPlayer();
    }

    private void createLayout() {
        root = new FrameLayout(this);
        root.setBackgroundColor(BACKGROUND);
        page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        root.addView(page, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(8), 0, dp(16), 0);
        toolbar.setBackgroundColor(BACKGROUND);
        Button back = makeButton("Back");
        back.setContentDescription("Close player and return to StreamFarvis");
        back.setOnClickListener(view -> finish());
        toolbar.addView(back, new LinearLayout.LayoutParams(dp(80), dp(52)));
        TextView title = new TextView(this);
        title.setText(getIntent().getStringExtra(EXTRA_TITLE));
        title.setTextSize(16);
        title.setTextColor(Color.WHITE);
        title.setSingleLine(true);
        title.setEllipsize(TextUtils.TruncateAt.END);
        title.setPadding(dp(12), 0, 0, 0);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, -2, 1));
        page.addView(toolbar, new LinearLayout.LayoutParams(-1, dp(56)));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(android.content.res.ColorStateList.valueOf(ACCENT));
        page.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        playerContainer = new FrameLayout(this);
        playerContainer.setBackgroundColor(Color.BLACK);
        page.addView(playerContainer, new LinearLayout.LayoutParams(-1, 0, 1));

        errorPanel = new LinearLayout(this);
        errorPanel.setOrientation(LinearLayout.VERTICAL);
        errorPanel.setGravity(Gravity.CENTER);
        errorPanel.setPadding(dp(28), dp(24), dp(28), dp(24));
        errorPanel.setBackgroundColor(BACKGROUND);
        errorText = new TextView(this);
        errorText.setTextColor(Color.WHITE);
        errorText.setTextSize(17);
        errorText.setGravity(Gravity.CENTER);
        errorPanel.addView(errorText, new LinearLayout.LayoutParams(-1, -2));
        Button retry = makeButton("Retry player");
        retry.setOnClickListener(view -> loadPlayer());
        LinearLayout.LayoutParams retryLayout = new LinearLayout.LayoutParams(-2, dp(52));
        retryLayout.topMargin = dp(20);
        errorPanel.addView(retry, retryLayout);
        errorPanel.setVisibility(View.GONE);
        playerContainer.addView(errorPanel, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
    }

    private Button makeButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        return button;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // Multiple-window support routes target=_blank through onCreateWindow, where it is denied.
        settings.setSupportMultipleWindows(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            // Each nested origin can pause its own media; this installs no native callback.
            WebViewCompat.addDocumentStartJavaScript(webView, PAUSE_MEDIA_SCRIPT, Collections.singleton("*"));
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
            Toast.makeText(this, "Downloads are not available in the player.", Toast.LENGTH_SHORT).show());

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // HTTPS nested frames are required by the providers. They receive no app privileges.
                return request.isForMainFrame()
                    ? !PlayerUrlPolicy.isPlayerUrl(url)
                    : !PlayerUrlPolicy.isEmbeddedUrl(url);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                if (destroying) return;
                if (!PlayerUrlPolicy.isPlayerUrl(url)) {
                    view.stopLoading();
                    showError("This player tried to open an unsupported website. Go back and choose another source.");
                    return;
                }
                pageFailed = false;
                errorPanel.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!destroying && !pageFailed) progress.setVisibility(View.INVISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError("The player could not load. Check your connection, retry, or go back and choose another source.");
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 400) {
                    showError("The provider is unavailable (HTTP " + response.getStatusCode()
                        + "). Retry or go back and choose another source.");
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                if (error.getUrl().equals(view.getUrl()) || error.getUrl().equals(playerUrl)) {
                    showError("A secure connection to this provider could not be established. Choose another source.");
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                hideFullscreen();
                if (view.getParent() instanceof ViewGroup) ((ViewGroup) view.getParent()).removeView(view);
                view.destroy();
                if (webView == view) webView = null;
                showError("The Android player stopped. Tap Retry to reopen it.");
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (!destroying) progress.setProgress(newProgress);
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                return false;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, false, false);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<android.net.Uri[]> callback, FileChooserParams params) {
                callback.onReceiveValue(null);
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                result.confirm();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                result.cancel();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
                result.cancel();
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                showFullscreen(view, callback);
            }

            @Override
            public void onHideCustomView() {
                hideFullscreen();
            }

            @Override
            public Bitmap getDefaultVideoPoster() {
                Bitmap poster = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
                poster.eraseColor(Color.BLACK);
                return poster;
            }
        });
        playerContainer.addView(webView, 0, new FrameLayout.LayoutParams(-1, -1));
    }

    private void loadPlayer() {
        if (destroying) return;
        hideFullscreen();
        pageFailed = false;
        errorPanel.setVisibility(View.GONE);
        progress.setProgress(0);
        progress.setVisibility(View.VISIBLE);
        try {
            if (webView == null) createWebView();
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(playerUrl);
        } catch (RuntimeException exception) {
            showError("Android System WebView could not start. Update it on your device and try again.");
        }
    }

    private void showError(String message) {
        if (destroying || errorPanel == null) return;
        pageFailed = true;
        progress.setVisibility(View.INVISIBLE);
        errorText.setText(message);
        errorPanel.setVisibility(View.VISIBLE);
        errorPanel.bringToFront();
    }

    private void showFullscreen(View view, WebChromeClient.CustomViewCallback callback) {
        if (customView != null || destroying) {
            callback.onCustomViewHidden();
            return;
        }
        customView = view;
        customViewCallback = callback;
        previousOrientation = getRequestedOrientation();
        fullscreenContainer = new FrameLayout(this);
        fullscreenContainer.setBackgroundColor(Color.BLACK);
        fullscreenContainer.addView(view, new FrameLayout.LayoutParams(-1, -1));
        page.setVisibility(View.GONE);
        root.addView(fullscreenContainer, new FrameLayout.LayoutParams(-1, -1));
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), root);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
    }

    private void hideFullscreen() {
        if (customView == null) return;
        fullscreenContainer.removeAllViews();
        root.removeView(fullscreenContainer);
        customView = null;
        fullscreenContainer = null;
        page.setVisibility(View.VISIBLE);
        WindowCompat.getInsetsController(getWindow(), root).show(WindowInsetsCompat.Type.systemBars());
        setRequestedOrientation(previousOrientation);
        WebChromeClient.CustomViewCallback callback = customViewCallback;
        customViewCallback = null;
        if (callback != null) callback.onCustomViewHidden();
    }

    private void handleBack() {
        if (customView != null) hideFullscreen();
        else if (webView != null && webView.canGoBack()) webView.goBack();
        else finish();
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (webView != null) {
            webView.onResume();
            webView.setVisibility(View.VISIBLE);
            if (WebViewFeature.isFeatureSupported(WebViewFeature.MUTE_AUDIO)) {
                WebViewCompat.setAudioMuted(webView, false);
            }
        }
    }

    @Override
    protected void onPause() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (webView != null) {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.MUTE_AUDIO)) {
                WebViewCompat.setAudioMuted(webView, true);
            }
            // Pause direct and nested media while retaining provider state for return.
            webView.evaluateJavascript(
                "document.querySelectorAll('video,audio').forEach(function(m){m.pause();});"
                + "window.postMessage('streamfarvis:pause-media','*');", null);
            webView.onPause();
            webView.setVisibility(View.INVISIBLE);
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        destroying = true;
        hideFullscreen();
        if (webView != null) {
            webView.stopLoading();
            playerContainer.removeView(webView);
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        super.onDestroy();
    }
}
