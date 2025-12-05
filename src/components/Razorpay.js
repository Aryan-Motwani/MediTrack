import React, { useState, useEffect } from 'react';

const RazorpayTest = () => {
  const [amount, setAmount] = useState('');

  // Check if Razorpay SDK is loaded
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    const options = {
      
      key: 'rzp_live_RnqOet70XAGj0P', // Replace with your Razorpay key
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'Test Payment',
      description: 'Test transaction',
      handler: function (response) {
        alert('Payment successful: ' + response.razorpay_payment_id);
      },
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9999999999',
      },
      theme: {
        color: '#F37254',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <h2>Razorpay Test Payment</h2>
      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
};

export default RazorpayTest;

