import UIKit
import WebKit

public class PlayerViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let playerUrl: URL
    private let playerTitle: String

    private var webView: WKWebView!
    private var progressBar: UIProgressView!
    private var headerView: UIView!
    private var progressObserver: NSKeyValueObservation?

    public init(playerUrl: URL, playerTitle: String) {
        self.playerUrl = playerUrl
        self.playerTitle = playerTitle
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    public override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 9/255, green: 11/255, blue: 16/255, alpha: 1.0)
        setupViews()
        loadPlayer()
    }

    private func setupViews() {
        // Top Toolbar
        headerView = UIView()
        headerView.translatesAutoresizingMaskIntoConstraints = false
        headerView.backgroundColor = UIColor(red: 9/255, green: 11/255, blue: 16/255, alpha: 0.95)
        view.addSubview(headerView)

        let closeButton = UIButton(type: .system)
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.setTitle("✕ Close", for: .normal)
        closeButton.setTitleColor(.white, for: .normal)
        closeButton.titleLabel?.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
        closeButton.addTarget(self, action: #selector(handleClose), for: .touchUpInside)
        headerView.addSubview(closeButton)

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = playerTitle
        titleLabel.textColor = .white
        titleLabel.font = UIFont.systemFont(ofSize: 15, weight: .bold)
        titleLabel.lineBreakMode = .byTruncatingTail
        headerView.addSubview(titleLabel)

        // Loading Progress Bar
        progressBar = UIProgressView(progressViewStyle: .bar)
        progressBar.translatesAutoresizingMaskIntoConstraints = false
        progressBar.progressTintColor = UIColor(red: 229/255, green: 9/255, blue: 20/255, alpha: 1.0)
        progressBar.trackTintColor = .clear
        view.addSubview(progressBar)

        // Dedicated WKWebView with PiP and inline media playback enabled
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.allowsPictureInPictureMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.scrollView.backgroundColor = .black
        webView.navigationDelegate = self
        webView.uiDelegate = self
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 48),

            closeButton.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 16),
            closeButton.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),

            titleLabel.leadingAnchor.constraint(equalTo: closeButton.trailingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -16),
            titleLabel.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),

            progressBar.topAnchor.constraint(equalTo: headerView.bottomAnchor),
            progressBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressBar.heightAnchor.constraint(equalToConstant: 2),

            webView.topAnchor.constraint(equalTo: progressBar.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        progressObserver = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] (_, change) in
            guard let self = self, let progress = change.newValue else { return }
            self.progressBar.progress = Float(progress)
            self.progressBar.isHidden = progress >= 1.0
        }
    }

    private func loadPlayer() {
        var request = URLRequest(url: playerUrl)
        request.timeoutInterval = 30
        webView.load(request)
    }

    @objc private func handleClose() {
        webView.evaluateJavaScript("document.querySelectorAll('video,audio').forEach(m => m.pause());", completionHandler: nil)
        dismiss(animated: true, completion: nil)
    }

    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        webView.evaluateJavaScript("document.querySelectorAll('video,audio').forEach(m => m.pause());", completionHandler: nil)
    }

    deinit {
        progressObserver?.invalidate()
        webView?.stopLoading()
        webView?.navigationDelegate = nil
        webView?.uiDelegate = nil
    }

    // WKNavigationDelegate
    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.targetFrame == nil {
            // Block external popup/new window navigation
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
