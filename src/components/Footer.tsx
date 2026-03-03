import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="max-w-[1400px] mx-auto px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DNexus" className="h-8" />
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
            <li><Link to="/trading" className="hover:text-primary transition-colors">Trading Hub</Link></li>
            <li><Link to="/signals" className="hover:text-primary transition-colors">AI Signals</Link></li>
            <li><Link to="/partners" className="hover:text-primary transition-colors">Partners Program</Link></li>
            <li><Link to="/education" className="hover:text-primary transition-colors">eLearning Academy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/education" className="hover:text-primary transition-colors">Education</Link></li>
            <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
            <li><a href="https://developers.deriv.com" target="_blank" rel="noopener" className="hover:text-primary transition-colors">API Docs</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/risk" className="hover:text-primary transition-colors">Risk Disclosure</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          DNexus is an independent third-party trading interface built using the official Deriv API. 
          We are not affiliated with Deriv Group. Trading involves risk. Past performance does not guarantee future results.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          © {new Date().getFullYear()} DNexus. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
