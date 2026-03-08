import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-gradient-dark">
    <Navbar />
    <div className="container py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Last Updated: February 2026</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">1. Introduction</h2>
        <p>DNexus ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our trading platform, website, and associated services (collectively, the "Services"). Please read this policy carefully. By using our Services, you consent to the practices described herein.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">2. Information We Collect</h2>
        <p>We collect information in the following ways:</p>
        <h3 className="text-base font-semibold text-foreground mt-4">2.1 Information You Provide</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-foreground">Authentication Data:</strong> When you connect your Deriv account through OAuth2, we receive your account identifiers (login IDs), account type (real or demo), and currency preferences. We do not receive or store your Deriv password.</li>
          <li><strong className="text-foreground">Trading Preferences:</strong> Your selected markets, trading strategies, risk parameters, and platform settings.</li>
          <li><strong className="text-foreground">Communication Data:</strong> Information you provide when contacting our support team or participating in surveys.</li>
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4">2.2 Automatically Collected Information</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, trading activity patterns, time spent on the platform, and interaction with our tools.</li>
          <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, device type, screen resolution, and IP address.</li>
          <li><strong className="text-foreground">Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage patterns.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, maintain, and improve our Services, including trading tools, signals, and analytics.</li>
          <li>Authenticate your identity and manage your account session securely.</li>
          <li>Process trades and apply commission calculations transparently.</li>
          <li>Personalize your experience, including tailored trading recommendations and educational content.</li>
          <li>Monitor and analyze usage trends to improve platform performance and user experience.</li>
          <li>Detect, prevent, and address fraud, security breaches, and technical issues.</li>
          <li>Communicate with you about updates, security alerts, and support messages.</li>
          <li>Comply with legal obligations and enforce our Terms of Service.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">4. Data Security</h2>
        <p>We implement industry-standard security measures to protect your information, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>256-bit SSL/TLS encryption for all data transmitted between your browser and our servers.</li>
          <li>Secure session management using short-lived tokens stored in session storage (not persistent cookies).</li>
          <li>Server-side storage of sensitive API keys and credentials — never exposed to the client.</li>
          <li>Regular security audits and vulnerability assessments.</li>
          <li>Role-based access controls for our internal systems.</li>
        </ul>
        <p>While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">5. Data Sharing and Disclosure</h2>
        <p>We do not sell, rent, or trade your personal information. We may share your data in the following circumstances:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-foreground">Service Providers:</strong> We share data with trusted third-party service providers who assist us in operating our platform (e.g., hosting, analytics). These providers are contractually obligated to protect your data.</li>
          <li><strong className="text-foreground">Deriv API:</strong> Trading operations require communication with Deriv's servers. Your account tokens are transmitted securely for trade execution.</li>
          <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose information if required by law, regulation, legal process, or governmental request.</li>
          <li><strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access, correct, or delete your personal information.</li>
          <li>Object to or restrict certain processing activities.</li>
          <li>Data portability — receive your data in a structured, machine-readable format.</li>
          <li>Withdraw consent at any time (where processing is based on consent).</li>
        </ul>
        <p>To exercise any of these rights, please contact us through our Help Center.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">7. Data Retention</h2>
        <p>We retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Session-based authentication tokens are automatically cleared when you close your browser or log out.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">8. Children's Privacy</h2>
        <p>Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete that information promptly.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our platform with a revised "Last Updated" date. We encourage you to review this policy periodically.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">10. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through our Help Center or email us at privacy@dnexus.com.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
