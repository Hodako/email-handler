const express = require('express');
const nodemailer = require('nodemailer');
const { render } = require('@react-email/render');
const React = require('react');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.SMTP_SECURE === 'TLS' ? false : true, // TLS uses port 587, SSL uses 465
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

// Import email components (you'll need to copy them or create them here)
const WelcomeEmail = ({ name }) => React.createElement('div', null,
  React.createElement('h1', null, `Welcome to Banglapremium, ${name}!`),
  React.createElement('p', null, 'Thank you for joining us. Your account has been created successfully.')
);

const LoginNotificationEmail = ({ name, email, loginTime }) => React.createElement('div', null,
  React.createElement('h1', null, 'Login Notification'),
  React.createElement('p', null, `Hello ${name},`),
  React.createElement('p', null, `You logged in to your Banglapremium account at ${loginTime}.`),
  React.createElement('p', null, 'If this was not you, please contact support immediately.')
);

const PasswordResetEmail = ({ resetLink, expires }) => React.createElement('div', null,
  React.createElement('h1', null, 'Reset Your Banglapremium Password'),
  React.createElement('p', null, 'You requested a password reset for your Banglapremium account.'),
  React.createElement('p', null, `Click the link below to reset your password. This link will expire on ${expires}.`),
  React.createElement('a', { href: resetLink }, 'Reset Password'),
  React.createElement('p', null, 'If you did not request this, please ignore this email.')
);

const BroadcastEmail = ({ subject, message }) => React.createElement('div', null,
  React.createElement('h1', null, subject),
  React.createElement('div', { dangerouslySetInnerHTML: { __html: message } })
);

const OrderStatusUpdateEmail = ({ order, userName, status, message }) => React.createElement('div', null,
  React.createElement('h1', null, `Order Status Update`),
  React.createElement('p', null, `Hello ${userName},`),
  React.createElement('p', null, `Your order #${order.id.slice(-8)} status has been updated to: ${status}`),
  React.createElement('p', null, message),
  React.createElement('p', null, 'Thank you for choosing Banglapremium!')
);

const ProductDeliveryEmail = ({ item, recipientEmail }) => React.createElement('div', null,
  React.createElement('h1', null, `Your Digital Product: ${item.product.name}`),
  React.createElement('p', null, 'Congratulations! Your digital product has been delivered.'),
  React.createElement('h2', null, 'Product Details:'),
  React.createElement('ul', null,
    React.createElement('li', null, `Product: ${item.product.name}`),
    React.createElement('li', null, `Quantity: ${item.quantity}`),
    React.createElement('li', null, `Price: $${item.price}`)
  ),
  React.createElement('p', null, 'If you have any questions, please contact our support team.'),
  React.createElement('p', null, 'Thank you for your purchase!')
);

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, type, data } = req.body;

    let reactComponent;
    if (type === 'welcome') {
      reactComponent = React.createElement(WelcomeEmail, { name: data.name });
    } else if (type === 'login-notification') {
      reactComponent = React.createElement(LoginNotificationEmail, {
        name: data.name,
        email: data.email,
        loginTime: data.loginTime
      });
    } else if (type === 'password-reset') {
      reactComponent = React.createElement(PasswordResetEmail, {
        resetLink: data.resetLink,
        expires: data.expires
      });
    } else if (type === 'broadcast') {
      reactComponent = React.createElement(BroadcastEmail, {
        subject: data.subject,
        message: data.message
      });
    } else if (type === 'order-status-update') {
      reactComponent = React.createElement(OrderStatusUpdateEmail, {
        order: data.order,
        userName: data.userName,
        status: data.status,
        message: data.message
      });
    } else if (type === 'product-delivery') {
      reactComponent = React.createElement(ProductDeliveryEmail, {
        item: data.item,
        recipientEmail: data.recipientEmail
      });
    } else {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    const html = render(reactComponent);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Email handler service running on port ${PORT}`);
});
