import { Link } from "react-router-dom";
import { Mail, Phone, Instagram, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-[#141414] border-t border-gray-800">
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-16">
      {/* CTA Section */}
      <div className="mb-16 p-8 rounded-2xl bg-gray-900 border border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">New to trading?</h3>
            <p className="text-gray-400">Sign up for a free demo account and start practicing today!</p>
          </div>
          <a 
            href="https://deriv.com/?t=xA1buvJrGeASmsCwn5r1F2Nd7ZgqdRLk&utm_source=affiliate_187242&utm_medium=affiliate&utm_campaign=MyAffiliates&utm_content=&referrer=" 
            target="_blank" 
            rel="noopener" 
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors whitespace-nowrap"
          >
            Create Deriv Account →
          </a>
        </div>
      </div>

      {/* Footer Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Platforms */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platforms</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Trading Hub</a></li>
            <li><a href="#" className="hover:text-white transition-colors">AI Trading Assistant</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Premium Signals</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Partners Program</a></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/education" className="hover:text-white transition-colors">Education</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Market Tracker</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Charts</a></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Account</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Account Dashboard</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Billing & Subscriptions</a></li>
            <li><a href="#" className="hover:text-white transition-colors">SSO Portal</a></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#e41f28]" />
              <a href="mailto:info@dnexus.com" className="hover:text-white transition-colors">info@dnexus.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#e41f28]" />
              <a href="tel:+6283140785152" className="hover:text-white transition-colors">+62-831-4078-5152</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Social Links & Copyright */}
      <div className="border-t border-gray-800 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-500 text-center md:text-left">
            Copyright 2026 © DNexus App
          </p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener" className="text-gray-400 hover:text-[#e41f28] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="text-gray-400 hover:text-[#e41f28] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
