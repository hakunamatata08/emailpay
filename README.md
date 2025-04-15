# EmailPay ✉️💸
![image](https://github.com/user-attachments/assets/e2ef525a-3524-4fcf-a990-1d059dc24e17)

**Demo Video**
https://www.youtube.com/watch?v=1LHI6z_zvc4

**Send crypto as easily as sending an email.**  
Fast, simple, and borderless payments powered by blockchain.


## 🌟 Key Features
- **Email-Based Transfers**: Send crypto to any email address. No blockchain address required.
- **User-Friendly Interface**: Intuitive design that makes sending crypto as easy as composing an email.
- **Multiple Currencies**: Can support any ERC-20 token on any EVM chain, currently only PYUSD.
- **Gasless Transactions**: Zero gas fees for senders, EIP2612 in action.
- **Instant Transfers**: Crypto arrives in seconds, not days. Real-time notifications for sender and recipient.
- **Global & Secure**: End-to-end encryption with Ethereum blockchain security.
- **Email Confirmations**: Recipients receive transaction details via email.

## 🚀 How It Works
1. **Sign In**: Log in with your email to access your non custodial crypto wallet.
2. **Top Up**: Deposit crypto into your wallet. Currently, only PYUSD is supported. You can topup PYUSD via the 'Topup PYUSD' option on Dashboard page.
3. **Compose Cryptomail**: Enter recipient emails (To/Cc/Bcc), amount, and currency ( currently only PYUSD on Ethereum Sepolia is supported, EmailPay can be configured to set up on any EVM compatible chain).
4. **Send**: Transactions are processed instantly with no gas fees.
5. **Recipient Claims**: Recipients get an email with transfer details confirming they've recieved the crypto. When they'll log in to the app, they can see their crypto.

## 📖 Use Cases
- **Crypto Payouts**: Pay freelancers, employees & gig workers with no wallet setup needed – just an email. Faster & cheaper than bank transfer.
- **Gift Cards**: Send PYUSD as a gift instead of traditional cards. Perfect for birthdays, holidays & rewards with instant delivery, no middlemen.
- **Peer-to-Peer Transfers**: Pay back friends & family in seconds with no bank details or crypto wallets needed. Perfect for splitting bills, rent, or meals.
- **Crypto Onboarding**: First-time crypto users can receive PYUSD easily with no complicated wallet setup needed. They can hold, spend, or withdraw anytime.
- **E-commerce Payments**: Merchants can accept PYUSD via email with no payment gateway setup required. Instant, low-fee transactions.
- **Fundraising & Donations**: Accept crypto donations easily with no need for complex crypto wallets. Perfect for charities & crowdfunding.

## 🛠️ Tech Stack
- **Frontend**: Next.JS
- **Backend**: Next.JS , MongoDB
- **Blockchain**: Solidity (Ethereum Smart Contracts)
- **Security**: Web3Auth as authentication provider and wallet creation
- **Email Service**: Nodemailer (for sending email reciepts)

## 🚧 Getting Started
### Prerequisites
- Node.js v18+
- npm/yarn

### Installation
1. Clone the repo:
   ```bash
   https://github.com/hakunamatata08/emailpay

2. Install dependencies:
   ```bash
   cd emailpay
   npm install

3. Run the app ( using default credentials in .env.local , these are my credentials, you can also set up your own ) :
   ```bash
   npm run dev
