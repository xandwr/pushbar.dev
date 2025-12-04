<script>
    let email = "";

    /**
     * @param {{ preventDefault: () => void; }} e
     */
    function handleEmailSubmit(e) {
        e.preventDefault();
        // TODO: Handle email signup
        console.log("Email submitted:", email);
    }
</script>

<svelte:head>
    <title>Pushbar - Local AI Developer Tools</title>
    <meta
        name="description"
        content="AI-powered dev tools that run on your machine, not theirs. No cloud. No subscriptions."
    />
</svelte:head>

<div class="container">
    <!-- Hero -->
    <header class="hero">
        <h1>
            AI dev tools that run on <span class="highlight">your machine</span
            >, not theirs.
        </h1>
        <p class="subtitle">
            Search codebases, generate docs, analyze dependencies—powered by AI
            running 100% locally.
        </p>
        <div class="cta-buttons">
            <a href="#buy" class="btn btn-primary">Get Pushbar - $29.99</a>
            <a href="#demo" class="btn btn-secondary">See Demo</a>
        </div>
        <p class="subtext">
            One-time purchase. No subscriptions. Linux only (for now).
        </p>
    </header>

    <!-- Features -->
    <section class="features" id="features">
        <h2>Three Tools. One Purchase.</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="icon">🔍</div>
                <h3>Semantic Search</h3>
                <p>
                    Ask questions about your code in natural language. Get
                    answers with citations pointing to exact file locations.
                </p>
            </div>
            <div class="feature-card">
                <div class="icon">📚</div>
                <h3>Dependency Docs</h3>
                <p>
                    Generate comprehensive documentation for any dependency—from
                    the actual source code you have installed.
                </p>
            </div>
            <div class="feature-card">
                <div class="icon">🗺️</div>
                <h3>CodeShape</h3>
                <p>
                    Understand any codebase's architecture in seconds. See entry
                    points, API surface, and dependency graphs.
                </p>
            </div>
        </div>
    </section>

    <!-- Privacy Guarantee -->
    <section class="privacy">
        <h2>Your Code Never Leaves Your Machine</h2>
        <div class="privacy-grid">
            <div class="privacy-point">
                <strong>100% Local</strong>
                <p>
                    Requires Ollama running locally. Your data stays on your
                    device.
                </p>
            </div>
            <div class="privacy-point">
                <strong>No Cloud</strong>
                <p>No API calls. No tracking. Works completely offline.</p>
            </div>
            <div class="privacy-point">
                <strong>No Subscriptions</strong>
                <p>Pay once. Own forever. No recurring costs.</p>
            </div>
        </div>
    </section>

    <!-- Demo Section -->
    <section class="demo" id="demo">
        <h2>See It In Action</h2>
        <div class="terminal-container">
            <div class="terminal-placeholder">
                <p>// xterm.js demo goes here</p>
                <p>// Animated terminal showing Pushbar in action</p>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section class="pricing" id="buy">
        <h2>Simple Pricing</h2>
        <div class="pricing-card">
            <div class="price">$29.99</div>
            <p class="price-description">One-time purchase. Lifetime access.</p>
            <ul class="included">
                <li>✓ Semantic Search</li>
                <li>✓ Dependency Documentation</li>
                <li>✓ CodeShape Analysis</li>
                <li>✓ All future updates</li>
                <li>✓ Linux binary (43.7 MB)</li>
            </ul>
            <a
                href="https://your-lemonsqueezy-link.com"
                class="btn btn-primary btn-large">Buy Now</a
            >
            <p class="requirements">Requires: Ollama (free) + Linux</p>
        </div>
    </section>

    <!-- FAQ -->
    <section class="faq">
        <h2>FAQ</h2>
        <div class="faq-item">
            <strong>Do I need an internet connection?</strong>
            <p>No. Once installed, Pushbar works completely offline.</p>
        </div>
        <div class="faq-item">
            <strong>What's Ollama?</strong>
            <p>
                A free, open-source tool for running AI models locally. Download
                at ollama.ai
            </p>
        </div>
        <div class="faq-item">
            <strong>Windows/Mac support?</strong>
            <p>Linux only for v1. Windows/Mac coming if there's demand.</p>
        </div>
        <div class="faq-item">
            <strong>Refund policy?</strong>
            <p>Not satisfied? Email within 14 days for full refund.</p>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <p>
            Built by <a href="https://xandwr.ca">xandwr</a> • Questions? Email support@pushbar.dev
            (not set up yet lol, xandwrp@gmail.com for now thx)
        </p>
    </footer>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        background: #0a0e27;
        color: #e0e0e0;
        line-height: 1.6;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }

    /* Hero */
    .hero {
        text-align: center;
        padding: 100px 20px 80px;
    }

    .hero h1 {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 700;
        margin: 0 0 20px;
        line-height: 1.2;
    }

    .highlight {
        color: #00bfff;
    }

    .subtitle {
        font-size: 1.25rem;
        color: #a0a0a0;
        margin-bottom: 40px;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    .cta-buttons {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
    }

    .btn {
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s;
        display: inline-block;
    }

    .btn-primary {
        background: #00bfff;
        color: #0a0e27;
    }

    .btn-primary:hover {
        background: #00a8e6;
        transform: translateY(-2px);
    }

    .btn-secondary {
        background: transparent;
        color: #00bfff;
        border: 2px solid #00bfff;
    }

    .btn-secondary:hover {
        background: rgba(0, 191, 255, 0.1);
    }

    .btn-large {
        font-size: 1.125rem;
        padding: 18px 40px;
    }

    .subtext {
        color: #707070;
        font-size: 0.9rem;
    }

    /* Features */
    .features {
        padding: 80px 20px;
    }

    .features h2 {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 60px;
    }

    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 40px;
    }

    .feature-card {
        background: rgba(255, 255, 255, 0.05);
        padding: 40px 30px;
        border-radius: 12px;
        border: 1px solid rgba(0, 191, 255, 0.2);
        transition: all 0.3s;
    }

    .feature-card:hover {
        border-color: #00bfff;
        transform: translateY(-4px);
    }

    .icon {
        font-size: 3rem;
        margin-bottom: 20px;
    }

    .feature-card h3 {
        font-size: 1.5rem;
        margin-bottom: 12px;
        color: #00bfff;
    }

    /* Privacy */
    .privacy {
        padding: 80px 20px;
        text-align: center;
        background: rgba(0, 191, 255, 0.05);
    }

    .privacy h2 {
        font-size: 2.5rem;
        margin-bottom: 60px;
    }

    .privacy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 40px;
    }

    .privacy-point strong {
        display: block;
        font-size: 1.25rem;
        color: #00bfff;
        margin-bottom: 8px;
    }

    /* Demo */
    .demo {
        padding: 80px 20px;
        text-align: center;
    }

    .demo h2 {
        font-size: 2.5rem;
        margin-bottom: 40px;
    }

    .terminal-container {
        max-width: 800px;
        margin: 0 auto;
        background: #000;
        border-radius: 12px;
        border: 1px solid #00bfff;
        padding: 40px;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .terminal-placeholder {
        color: #00bfff;
        font-family: "Courier New", monospace;
    }

    /* Pricing */
    .pricing {
        padding: 80px 20px;
        text-align: center;
    }

    .pricing h2 {
        font-size: 2.5rem;
        margin-bottom: 60px;
    }

    .pricing-card {
        max-width: 400px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.05);
        padding: 50px 40px;
        border-radius: 16px;
        border: 2px solid #00bfff;
    }

    .price {
        font-size: 3.5rem;
        font-weight: 700;
        color: #00bfff;
        margin-bottom: 8px;
    }

    .price-description {
        color: #a0a0a0;
        margin-bottom: 30px;
    }

    .included {
        list-style: none;
        padding: 0;
        margin: 30px 0;
        text-align: left;
    }

    .included li {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .requirements {
        margin-top: 20px;
        font-size: 0.9rem;
        color: #707070;
    }

    /* FAQ */
    .faq {
        padding: 80px 20px;
        max-width: 800px;
        margin: 0 auto;
    }

    .faq h2 {
        font-size: 2.5rem;
        margin-bottom: 40px;
        text-align: center;
    }

    .faq-item {
        margin-bottom: 30px;
        padding-bottom: 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .faq-item strong {
        display: block;
        font-size: 1.25rem;
        margin-bottom: 8px;
        color: #00bfff;
    }

    /* Footer */
    footer {
        text-align: center;
        padding: 60px 20px 40px;
        color: #707070;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    footer a {
        color: #00bfff;
        text-decoration: none;
    }

    footer a:hover {
        text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .hero {
            padding: 60px 20px 40px;
        }

        .features,
        .privacy,
        .demo,
        .pricing,
        .faq {
            padding: 60px 20px;
        }

        .features h2,
        .privacy h2,
        .demo h2,
        .pricing h2,
        .faq h2 {
            font-size: 2rem;
        }
    }
</style>
