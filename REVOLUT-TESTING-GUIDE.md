# Revolut Testing Guide - 3DS & Redirects

## Test Environment Setup
- **Environment**: Sandbox
- **Webhook URL**: https://omekotitel-test.vercel.app/api/checkout/revolut-webhook
- **Webhook ID**: 2ecc57cb-9161-472b-8a24-627731c05e68

## Testing 3D Secure (3DS)

### Test Cards for 3DS Flow

Revolut provides specific test card numbers for different scenarios:

#### ✅ Successful 3DS Authentication
```
Card Number: 4000 0000 0000 3220
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```
- This card triggers 3DS challenge
- Authentication will succeed
- Payment completes successfully

#### ❌ Failed 3DS Authentication
```
Card Number: 4000 0000 0000 3063
Expiry: Any future date
CVV: Any 3 digits
```
- Triggers 3DS challenge
- Authentication fails
- Payment is declined

#### 🔄 3DS Required (Frictionless)
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVV: Any 3 digits
```
- Standard test card
- May trigger frictionless 3DS (no user interaction)
- Should complete successfully

### Testing the 3DS Flow

1. **Go to your test site**: https://omekotitel-test.vercel.app
2. **Add items to cart**
3. **Go to checkout**: `/onestepcheckout`
4. **Select "Revolut Pay" payment method**
5. **Fill in your details**
6. **Enter one of the 3DS test cards above**
7. **Click "Place Order"**

### Expected Behavior

#### What Should Happen:
1. Revolut creates an order
2. Your app gets a `public_id` from Revolut
3. Revolut checkout SDK opens (either popup or redirect depending on device)
4. User sees 3DS challenge page (password/code entry)
5. After authentication:
   - **On Success**: Redirects to `/onestepcheckout/success?order_id={magento_order_id}`
   - **On Failure**: Shows error message, stays on checkout

#### Debugging 3DS Issues:

**Check Browser Console**:
- Look for Revolut SDK logs
- Check for any JavaScript errors
- Monitor network tab for API calls

**Check Server Logs** (Vercel):
- Go to Vercel dashboard → Functions → Logs
- Look for:
  - `/api/checkout/revolut-order` (order creation)
  - `/api/checkout/revolut-webhook` (payment confirmation)
  - `/api/checkout/place` (Magento order placement)

**Webhook Events**:
The webhook should receive one of:
- `ORDER_COMPLETED` - payment successful
- `ORDER_PAYMENT_FAILED` - payment failed
- `ORDER_PAYMENT_DECLINED` - card declined

## Testing Redirects

### Mobile vs Desktop Behavior

**Desktop** (usually):
- Revolut opens in a popup/modal
- 3DS happens in the popup
- Closes automatically on success

**Mobile**:
- Revolut may redirect to their domain
- User completes 3DS on Revolut's page
- Redirects back to your success/failure URL

### Return URLs

Your app is configured to handle:
- **Success**: `/onestepcheckout/success?order_id={id}`
- **Cancel/Fail**: Returns to `/onestepcheckout` with error

### Testing Mobile Redirect Flow

1. Open test site on your phone: https://omekotitel-test.vercel.app
2. Complete checkout with test card
3. You should be redirected to Revolut's domain
4. Complete 3DS challenge
5. Should redirect back to your success page

### Force Redirect Mode (Desktop Testing)

To test redirect flow on desktop, you can modify the RevolutCheckout mode:

In `src/app/onestepcheckout/page.tsx`, find the RevolutCheckout initialization and change:
```typescript
mode: 'popup'  // change to 'redirect' to test redirect flow
```

## Common Issues & Solutions

### Issue: 3DS Popup Blocked
**Solution**: Ensure popup blockers are disabled for test domain

### Issue: Webhook Not Receiving Events
**Check**:
1. Webhook is registered (run `node register-revolut-webhook.js` to verify)
2. `REVOLUT_WEBHOOK_SIGNING_SECRET` is set in Vercel
3. Check Vercel function logs for webhook calls

### Issue: Order Not Completing
**Check**:
1. Webhook signature validation (check logs)
2. Magento API connection
3. Order total matches Revolut amount

### Issue: Redirect Loop
**Check**:
1. Session storage is working
2. Return URL is correctly configured
3. No CORS issues

## Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `NEXT_PUBLIC_REVOLUT_ENV` = `sandbox`
- ✅ `NEXT_PUBLIC_REVOLUT_PUBLIC_KEY` = `pk_D****EuDa`
- ✅ `REVOLUT_API_SECRET_KEY` = `sk__Bq4PllNZPqj0s39CqXBd8-6wBff4gaaWYkvzhu4OUqJjDW29NhN-yOvkjmOfmdb`
- ✅ `REVOLUT_WEBHOOK_SIGNING_SECRET` = `wsk_Ly31og4YB4Zn0GRnhOkvp4XDpx6lek4G`

## Additional Test Cards

### Different Card Brands

**Mastercard (3DS)**:
```
5555 5555 5555 4444
```

**Visa (No 3DS)**:
```
4242 4242 4242 4242
```

### Specific Decline Reasons

**Insufficient Funds**:
```
4000 0000 0000 9995
```

**Card Declined**:
```
4000 0000 0000 0002
```

**Expired Card**:
```
4000 0000 0000 0069
```

## Documentation Links

- [Revolut Merchant API Docs](https://developer.revolut.com/docs/merchant/merchant-api)
- [Revolut Web SDK Docs](https://developer.revolut.com/docs/sdks/merchant-web-sdk/introduction)
- [Test Cards](https://developer.revolut.com/docs/guides/merchant/test-in-sandbox)
- [Webhook Events](https://developer.revolut.com/docs/merchant/webhooks#callbacks)

## Quick Test Checklist

- [ ] Test successful 3DS payment
- [ ] Test failed 3DS authentication
- [ ] Test card decline
- [ ] Test mobile redirect flow
- [ ] Verify webhook receives ORDER_COMPLETED
- [ ] Check Magento order is created
- [ ] Verify success page shows order details
- [ ] Test error handling (network issues)

---

**Note**: Always redeploy your Vercel app after changing environment variables!
