# DollarData Email Templates

Use these HTML templates in your Supabase Dashboard under **Authentication -> Email Templates**.

## Confirm Your Email (Sign Up)

**Subject:** Confirm your DollarData account

**Body:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f9fafb; color: #1f2937;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; margin-top: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header / Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #2563eb; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">DollarData</h1>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">Verify your email address</h2>
            <p style="margin-bottom: 24px; color: #4b5563;">
                Thanks for starting your journey with DollarData! We're excited to help you take control of your finances.
            </p>
            <p style="margin-bottom: 32px; color: #4b5563;">
                Please verify your email address to secure your account and access your dashboard.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 32px;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; transition: background-color 0.2s;">
                    Verify Email Address
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                &copy; 2026 DollarData. All rights reserved.
            </p>
             <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                <a href="https://dollardata.au/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a> &middot; 
                <a href="https://dollardata.au/terms" style="color: #9ca3af; text-decoration: underline;">Terms of Service</a>
            </p>
        </div>
    </div>
</body>
</html>
```

### Setup Instructions
1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication** -> **Email Templates**.
3. Select **Confirm Signup**.
4. Paste the HTML code above into the **Message Body** field.
5. Set the **Subject** to "Confirm your DollarData account".
6. Click **Save**.
