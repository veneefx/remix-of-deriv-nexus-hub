import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-gradient-dark">
    <Navbar />
    <div className="container py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Last Updated: February 2026</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">1. Introduction</h2>
        <p>Welcome to DTNexus ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the DTNexus platform, including our website, trading tools, AI analytics, educational content, and partner programs (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use our platform.</p>
        <p>DTNexus is an independent third-party trading interface built using the official Deriv API. We are not affiliated with, endorsed by, or sponsored by Deriv Group or any of its subsidiaries. Our platform provides tools, analytics, and educational resources designed to enhance your trading experience on the Deriv platform.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">2. Eligibility</h2>
        <p>You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use our Services. By creating an account or using our platform, you represent and warrant that you meet this requirement. You are responsible for ensuring that your use of our Services complies with all applicable laws and regulations in your jurisdiction, including but not limited to financial regulations, tax obligations, and data protection laws.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">3. Account Registration and Security</h2>
        <p>To access certain features of our platform, you must connect your Deriv account through the official Deriv OAuth2 authentication system. DTNexus does not store your Deriv credentials directly. You are responsible for maintaining the confidentiality of your authentication tokens and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.</p>
        <p>We reserve the right to suspend or terminate your access to our Services at any time, with or without cause, and with or without notice. This includes, but is not limited to, situations where we reasonably believe that you have violated these Terms, engaged in fraudulent activity, or posed a risk to the security of our platform or other users.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">4. Services Description</h2>
        <p>DTNexus provides the following services through our platform:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-foreground">AI Trading Tools:</strong> Automated and manual trading interfaces that connect to the Deriv API, including digit analysis, pattern recognition, and strategy execution tools.</li>
          <li><strong className="text-foreground">Premium Signals:</strong> Technical analysis indicators, oscillator readings, and moving average calculations derived from real-time market data.</li>
          <li><strong className="text-foreground">Educational Content:</strong> Courses, tutorials, and learning resources covering trading fundamentals, technical analysis, risk management, and advanced strategies.</li>
          <li><strong className="text-foreground">Partners Program:</strong> An affiliate system that allows users to earn commissions by referring new traders to our platform.</li>
          <li><strong className="text-foreground">Market Analytics:</strong> Real-time market data visualization, comprehensive currency tracking, and performance analytics.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">5. Trading Risks</h2>
        <p>Trading financial instruments, including synthetic indices, forex, and derivatives, involves substantial risk of loss. You acknowledge and agree that:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Trading may not be suitable for all investors. You should carefully consider your financial situation and risk tolerance before trading.</li>
          <li>Past performance of any trading strategy, signal, or tool does not guarantee future results.</li>
          <li>AI-generated signals and automated trading strategies are tools to assist your decision-making, not guarantees of profit.</li>
          <li>You are solely responsible for your trading decisions and any resulting gains or losses.</li>
          <li>DTNexus shall not be liable for any trading losses incurred through the use of our platform.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">6. Commission and Fees</h2>
        <p>DTNexus applies a 3% commission markup on trades executed through our platform. This commission is transparently disclosed and is factored into the trade execution price. By using our trading tools, you acknowledge and agree to this commission structure. We reserve the right to modify our fee structure with reasonable notice to users.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">7. Intellectual Property</h2>
        <p>All content, features, and functionality of our platform — including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, software, and the compilation thereof — are the exclusive property of DTNexus or its licensors and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">8. User Conduct</h2>
        <p>You agree not to: (a) use our Services for any illegal purpose or in violation of any laws; (b) attempt to gain unauthorized access to any portion of our platform; (c) interfere with or disrupt the integrity or performance of our Services; (d) use automated scripts or bots to access our Services outside of the tools we provide; (e) reverse engineer, decompile, or disassemble any portion of our platform; (f) use our Services to transmit any malicious code, viruses, or harmful data.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">9. Privacy and Data Protection</h2>
        <p>Your privacy is important to us. Our collection, use, and disclosure of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our Services, you consent to our data practices as described in the Privacy Policy.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">10. Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, DTNexus and its officers, directors, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) our Services.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">11. Modifications to Terms</h2>
        <p>We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our platform with a revised "Last Updated" date. Your continued use of our Services after any such changes constitutes your acceptance of the new Terms.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">12. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, please contact us through our platform's Help Center or reach out to our support team at support@dtnexus.com.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
