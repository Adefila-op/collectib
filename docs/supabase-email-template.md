# Supabase Auth Email Template

Use this in Supabase Dashboard -> Authentication -> Email Templates -> Confirm signup.

Subject:

```text
Verify your Collectibles account
```

Body:

```html
<div style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe7f2;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 18px;">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0;color:#111827;">
                Collectibles <span style="color:#6d4aff;">Art</span>
              </p>
              <h1 style="margin:28px 0 10px;font-size:30px;line-height:1.18;color:#111827;">
                Verify your email
              </h1>
              <p style="margin:0;color:#526179;font-size:15px;line-height:1.65;">
                Welcome to Collectibles. Confirm this email to activate your account and continue into the marketplace.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 28px 28px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6d4aff;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 22px;border-radius:8px;">
                Verify email
              </a>
              <p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:8px 0 0;word-break:break-all;color:#4c2edb;font-size:13px;line-height:1.6;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e5edf6;">
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                This link expires for your security. If you did not request this email, you can ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
```

Supabase Auth URL settings:

```text
Site URL: https://collectibles-vite.vercel.app
Redirect URLs:
https://collectibles-vite.vercel.app/verify-email
https://collectibles-vite.vercel.app/reset-password
http://localhost:5173/verify-email
http://localhost:5173/reset-password
```
