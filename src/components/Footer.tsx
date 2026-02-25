import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Dnexus" className="h-8" />
            <span className="font-display text-lg font-bold">
              <span className="text-foreground">DN</span>
              <span className="text-primary">EXUS</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Experience AI-powered analytics, automated trading strategies, and professional signals in one unified platform.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platforms</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/trading" className="hover:text-primary transition-colors">Trading Hub</a></li>
            <li><a href="/signals" className="hover:text-primary transition-colors">AI Signals</a></li>
            <li><a href="/market-tracker" className="hover:text-primary transition-colors">Market Tracker</a></li>
            <li><a href="/charts" className="hover:text-primary transition-colors">Charts</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/education" className="hover:text-primary transition-colors">Education</a></li>
            <li><a href="https://developers.deriv.com" target="_blank" rel="noopener" className="hover:text-primary transition-colors">API Docs</a></li>
            <li><a href="/help" className="hover:text-primary transition-colors">Help Center</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            <li><a href="/risk" className="hover:text-primary transition-colors">Risk Disclosure</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Dnexus is an independent third-party trading interface built using the official Deriv API. 
          We are not affiliated with Deriv Group. Trading involves risk. Past performance does not guarantee future results.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          © {new Date().getFullYear()} Dnexus. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
