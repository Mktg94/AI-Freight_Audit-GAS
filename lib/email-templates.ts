function baseWrapper(content: string, footerText?: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
          ${content}
          <tr>
            <td style="background:#F8F9FB;padding:24px 40px;text-align:center;border-top:1px solid #E8EAED;">
              <p style="color:#8E929B;font-size:11px;line-height:1.5;margin:0 0 4px 0;">FreightAudit AI &bull; Automated Billing Protection</p>
              <p style="color:#B0B3B8;font-size:10px;margin:0;">${footerText || 'This is an automated message from FreightAudit AI'}</p>
            </td>
          </tr>
        </table>
        <p style="color:#B0B3B8;font-size:10px;margin:16px 0 0 0;">&copy; ${new Date().getFullYear()} FreightAudit AI. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function inviteEmailHtml(role: string, token: string, inviteLink: string) {
  const body = `
    <tr>
      <td style="background:linear-gradient(135deg,#4F46E5 0%,#6366F1 50%,#7C3AED 100%);padding:40px 40px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" align="center" style="width:56px;">
          <tr>
            <td style="background:rgba(255,255,255,0.15);border-radius:14px;text-align:center;padding:12px;">
              <span style="color:#ffffff;font-size:24px;line-height:1;">&#x1F6E1;</span>
            </td>
          </tr>
        </table>
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:16px 0 4px;letter-spacing:-0.3px;">Join FreightAudit AI</h1>
        <p style="color:rgba(255,255,255,0.65);font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;margin:0;">Automated Billing Protection Platform</p>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px 32px;">
        <h2 style="color:#1A1D23;font-size:20px;font-weight:700;margin:0 0 6px;">You're Invited</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
          You have been invited to join the FreightAudit AI platform as
          <span style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-size:12px;font-weight:600;padding:3px 12px;border-radius:6px;margin:0 2px;text-transform:capitalize;">${role.replace('_', ' ')}</span>
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;border-radius:12px;border:1px solid #E8EAED;margin-bottom:28px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #E8EAED;">
              <p style="color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px;">Role</p>
              <p style="color:#1A1D23;font-size:15px;font-weight:600;margin:0;text-transform:capitalize;">${role.replace('_', ' ')}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #E8EAED;">
              <p style="color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px;">Invitation Code</p>
              <p style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;color:#4F46E5;font-size:15px;font-weight:700;margin:0;letter-spacing:1.5px;">${token}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <p style="color:#6B7280;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 4px;">Expires</p>
              <p style="color:#1A1D23;font-size:14px;margin:0;">In 7 days</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#6366F1);color:#ffffff;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(79,70,229,0.35);">Accept Invitation</a>
            </td>
          </tr>
        </table>

        <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin:24px 0 0;text-align:center;">
          This invitation was sent by your organization administrator. If you were not expecting this, you can safely ignore this email.
        </p>
      </td>
    </tr>`;
  return baseWrapper(body, 'This is an automated invitation from FreightAudit AI');
}

export function disputeEmailHtml(invoiceNumber: string, carrierName: string, disputedAmount: number, letterText: string, disputeId: string) {
  const formattedAmount = Number(disputedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
    <tr>
      <td style="background:linear-gradient(135deg,#D97706 0%,#F59E0B 50%,#B45309 100%);padding:40px 40px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" align="center" style="width:56px;">
          <tr>
            <td style="background:rgba(255,255,255,0.15);border-radius:14px;text-align:center;padding:12px;">
              <span style="color:#ffffff;font-size:26px;line-height:1;">&#x1F4CB;</span>
            </td>
          </tr>
        </table>
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:16px 0 4px;letter-spacing:-0.3px;">Billing Dispute Notice</h1>
        <p style="color:rgba(255,255,255,0.65);font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;margin:0;">FreightAudit AI &bull; Automated Billing Protection</p>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px 32px;">
        <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
          A billing discrepancy has been identified on invoice <strong style="color:#1A1D23;">#${invoiceNumber}</strong>. 
          Please review the dispute details below at your earliest convenience.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin-bottom:28px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="color:#92400E;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 16px;">Dispute Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#78350F;font-size:13px;">
                    <strong>Invoice:</strong> #${invoiceNumber}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350F;font-size:13px;">
                    <strong>Carrier:</strong> ${carrierName || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350F;font-size:13px;">
                    <strong>Disputed Amount:</strong> <span style="color:#D97706;font-weight:700;">$${formattedAmount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#78350F;font-size:13px;">
                    <strong>Date:</strong> ${today}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <h3 style="color:#1A1D23;font-size:14px;font-weight:700;margin:0 0 12px;">Dispute Letter</h3>
        <div style="background:#F8F9FB;border-radius:10px;padding:24px;border-left:4px solid #F59E0B;line-height:1.8;color:#374151;font-size:13px;white-space:pre-wrap;">
          ${letterText.replace(/\n/g, '<br>')}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#D97706;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.3px;box-shadow:0 2px 8px rgba(217,119,6,0.25);">
                Dispute Ref: ${disputeId.slice(0, 8).toUpperCase()}
              </div>
            </td>
          </tr>
        </table>

        <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin:24px 0 0;text-align:center;">
          This is an official billing dispute generated by FreightAudit AI. Please review and respond at your earliest convenience.
        </p>
      </td>
    </tr>`;
  return baseWrapper(body, 'This is an automated dispute communication. Please do not reply to this email.');
}
