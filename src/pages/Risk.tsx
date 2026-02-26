import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Risk = () => (
  <div className="min-h-screen bg-gradient-dark">
    <Navbar />
    <div className="container py-16 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Risk Disclosure</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Last Updated: February 2026</p>

        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-8">
          <p className="text-sm text-destructive font-semibold">⚠️ Important Warning: Trading financial instruments involves significant risk and may not be suitable for all investors. You should only trade with money you can afford to lose.</p>
        </div>

        <h2 className="text-lg font-semibold text-foreground mt-8">1. General Risk Warning</h2>
        <p>Trading in financial markets, including but not limited to synthetic indices, forex, cryptocurrencies, and derivatives, carries a high level of risk and may result in the loss of some or all of your investment capital. The value of financial instruments can fluctuate rapidly and unpredictably, and past performance is not indicative of future results.</p>
        <p>Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. You should be aware of all the risks associated with trading and seek independent financial advice if you have any doubts.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">2. Specific Risks</h2>
        <h3 className="text-base font-semibold text-foreground mt-4">2.1 Market Risk</h3>
        <p>The prices of financial instruments are determined by market forces and can be affected by a variety of factors, including but not limited to: economic indicators, political events, natural disasters, market sentiment, and liquidity conditions. These factors can cause rapid and significant price movements that may result in losses exceeding your initial investment.</p>

        <h3 className="text-base font-semibold text-foreground mt-4">2.2 Volatility Risk</h3>
        <p>Synthetic indices and volatility markets are characterized by high price volatility. While this volatility creates trading opportunities, it also significantly increases the risk of loss. The DTNexus platform's digit trading tools operate on 1-tick contracts, which means results are determined instantly and cannot be reversed.</p>

        <h3 className="text-base font-semibold text-foreground mt-4">2.3 Technology Risk</h3>
        <p>Trading through electronic platforms carries inherent technological risks, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Internet connectivity issues that may prevent order execution or cause delays.</li>
          <li>System failures, software bugs, or hardware malfunctions.</li>
          <li>Cybersecurity threats, including hacking, phishing, and data breaches.</li>
          <li>WebSocket connection interruptions that may affect real-time data feeds.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground mt-4">2.4 Automated Trading Risk</h3>
        <p>DTNexus offers automated trading features powered by AI and algorithmic strategies. While these tools are designed to assist your trading, they carry specific risks:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Automated systems may execute trades based on historical patterns that may not repeat in the future.</li>
          <li>AI predictions and signals are probabilistic, not guaranteed.</li>
          <li>Martingale and other progressive staking strategies can lead to rapid account depletion during losing streaks.</li>
          <li>Technical malfunctions may cause unintended trades or failure to execute stop-loss orders.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground mt-4">2.5 Signal and Analysis Risk</h3>
        <p>The Premium Signals and analysis tools provided by DTNexus are derived from technical indicators and mathematical calculations. These signals:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Are not investment advice and should not be solely relied upon for trading decisions.</li>
          <li>May have varying accuracy rates depending on market conditions.</li>
          <li>Are generated from historical data and may not accurately predict future price movements.</li>
          <li>Should be used in conjunction with your own analysis and risk management.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">3. Financial Considerations</h2>
        <p>You should never invest money that you cannot afford to lose. Consider the following before trading:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Only use disposable income for trading — never use funds needed for essential expenses.</li>
          <li>Set clear stop-loss limits and take-profit targets for every trade.</li>
          <li>Never chase losses or increase your stake size after a losing streak.</li>
          <li>Regularly withdraw profits to protect your gains.</li>
          <li>Consider the impact of the 3% commission on your overall trading costs.</li>
          <li>Be aware of tax obligations related to trading profits in your jurisdiction.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground mt-8">4. Regulatory Notice</h2>
        <p>DTNexus is an independent technology platform that provides trading tools and analytics. We are not a broker, dealer, financial advisor, or investment company. We do not hold client funds — all trading funds are held in your personal Deriv account. The regulatory status of online trading varies by jurisdiction, and it is your responsibility to ensure compliance with local laws.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">5. No Guarantee of Profits</h2>
        <p>DTNexus does not guarantee any profits or returns on your trading activities. Any testimonials, performance statistics, or historical results displayed on our platform are for illustrative purposes only and do not represent a guarantee of future performance. Trading results vary among users based on experience, strategy, market conditions, and risk management practices.</p>

        <h2 className="text-lg font-semibold text-foreground mt-8">6. Acknowledgment</h2>
        <p>By using the DTNexus platform, you acknowledge that:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>You have read and understood this Risk Disclosure in its entirety.</li>
          <li>You understand that trading involves significant risk of loss.</li>
          <li>You are trading at your own risk and DTNexus shall not be liable for any losses.</li>
          <li>You have the financial capacity to bear the risk of loss.</li>
          <li>You will seek independent financial advice if you have any doubts about the suitability of trading.</li>
        </ul>
      </div>
    </div>
    <Footer />
  </div>
);

export default Risk;
