# EmailPay ✉️💸
![image](https://github.com/user-attachments/assets/e2ef525a-3524-4fcf-a990-1d059dc24e17)

**Demo Video**
https://www.youtube.com/watch?v=1LHI6z_zvc4

**Send crypto as easily as sending an email.**  
Fast, simple, and borderless payments powered by blockchain.

## The Problem
Sending crypto is still too technical and intimidating for everyday users.
People need to remember long wallet addresses, worry about gas fees, and understand blockchain jargon — all of which create friction and limit mainstream adoption.

## Our Solution
We’re building EmailPay, a crypto payment platform that lets users send digital assets to any email address—no wallet address or crypto knowledge required. The sender simply logs in with their email, tops up their wallet with supported tokens (currently PYUSD on Sepolia), and composes a “cryptomail” just like a regular email. They can enter recipients in To, Cc, or Bcc fields, specify the amount, and send. The recipient then receives an email notification with transaction details and can claim their funds upon logging into the platform. This creates a seamless experience that mimics traditional email workflows while abstracting away the complexities of crypto transactions.

EmailPay uses EIP-2612 permit-based transfers, enabling gasless transactions for the sender, which further reduces friction. It also leverages Web3Auth for email-based login and wallet creation, making onboarding simple and secure. Under the hood, we're using Ethereum smart contracts to handle the transfers and Nodemailer to send real-time notifications. By combining the simplicity of email with the power of blockchain, EmailPay enables fast, secure, and borderless payments for individuals, businesses, and nonprofits alike — driving crypto adoption through intuitive UX.

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
   ![image](https://github.com/user-attachments/assets/8c5aa11f-80a9-4a92-a1c4-b5f59e0d04d2)

3. **Top Up**: Deposit crypto into your wallet. Currently, only PYUSD is supported. You can topup PYUSD via the 'Topup PYUSD' option on Dashboard page. PYUSD arrives in 1-2 minutes in your wallet.
   ![image](https://github.com/user-attachments/assets/1a662a04-94e2-4411-965d-c0795500063f)
   NOTE : You can only request 1 time per account in 24 hour period.
   
5. **Compose Cryptomail**: Enter recipient emails (To/Cc/Bcc), amount, and currency ( currently only PYUSD on Ethereum Sepolia is supported, EmailPay can be configured to set up on any EVM compatible chain).
   ![image](https://github.com/user-attachments/assets/f3414902-7587-4c11-b56f-46dbe67bf46d)

7. **Send**: Transactions are processed instantly with no gas fees.
   ![image](https://github.com/user-attachments/assets/52f93645-2b84-47d8-b1d8-956b250dd827)
   ![image](https://github.com/user-attachments/assets/5d6cce27-44df-4103-b616-946857740f84)
   ![image](https://github.com/user-attachments/assets/390c5818-357f-446a-a8b5-ad2967f1c00e)

9. **Recipient Claims**: Recipients get an email with transfer details confirming they've recieved the crypto. When they'll log in to the app, they can see crypto in their wallet as well as the in-app notification about the transaction.
    ![WhatsApp Image 2025-04-15 at 11 05 08 PM](https://github.com/user-attachments/assets/fee0e2c9-66d2-4bdb-9369-a838e6461470)
   ![WhatsApp Image 2025-04-15 at 11 05 45 PM](https://github.com/user-attachments/assets/5576966f-b24e-43bd-b839-16c835096579)

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
