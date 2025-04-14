# EmailPay ✉️💸

**Send crypto as easily as sending an email.**  
Fast, simple, and borderless payments powered by blockchain.


## 🌟 Key Features
- **Email-Based Transfers**: Send crypto to any email address. No blockchain address required.
- **Gasless Transactions**: Zero gas fees for senders, EIP2612 in action.
- **Instant Transfers**: Real-time blockchain confirmations and email notifications.
- **Global & Secure**: End-to-end encryption with Ethereum blockchain security.
- **Email Confirmations**: Recipients receive transaction details via email.

## 🚀 How It Works
1. **Sign In**: Log in with your email to access your crypto wallet.
2. **Top Up**: Deposit crypto into your wallet.
3. **Compose Cryptomail**: Enter recipient emails (To/Cc/Bcc), amount, and currency ( currently only PYUSD on Ethereum Sepolia is supported but EmailPay can be configured to set up on any EVM compatible chain).
4. **Send**: Transactions are processed instantly with no gas fees.
5. **Recipient Claims**: Recipients get an email with transfer details confirming they've recieved the crypto. When they'll log in to the app, they can see their crypto.

## 📖 Use Cases
- **Fundraising**: Non-profits can accept donations via email (e.g., PYUSD).
- **Global Payments**: Send crypto to friends, family, or businesses worldwide.
- **Business Transactions**: Streamline B2B payments with email-based invoicing.

## 🛠️ Tech Stack
- **Frontend**: Next.JS
- **Backend**: Next.JS , MongoDB
- **Blockchain**: Solidity (Ethereum Smart Contracts)
- **Security**: Web3Auth as authentication provider 
- **Email Service**: Nodemailer (for sending email reciepts)

## 🚧 Getting Started
### Prerequisites
- Node.js v18+
- npm/yarn

### Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/emailpay.git