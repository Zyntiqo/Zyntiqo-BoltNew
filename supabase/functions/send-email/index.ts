// @ts-nocheck
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_FROM_EMAIL = "Zyntiqo <onboarding@resend.dev>";

type EmailRequest = {
  to: string;
  template: string;
  data: Record<string, unknown>;
};

type TemplateResult = { subject: string; html: string };

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Zyntiqo</title>
</head>
<body style="margin:0;padding:0;background:#060a12;font-family:Inter,system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060a12;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0a0f1a;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
<h1 style="margin:0;font-size:22px;font-weight:700;color:#22d3ee;letter-spacing:-0.02em;">Zyntiqo</h1>
<p style="margin:4px 0 0;font-size:12px;color:#64748b;letter-spacing:0.05em;text-transform:uppercase;">Build. Grow. Automate.</p>
</td></tr>
<tr><td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.6;">
${content}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:12px;color:#64748b;">This email was sent by Zyntiqo. Visit us at <a href="https://www.zyntiqo.com" style="color:#22d3ee;text-decoration:none;">www.zyntiqo.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function fieldRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:500;">${value}</td></tr>`;
}

function infoTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">${rows.map(([l, v]) => fieldRow(l, v)).join("")}</table>`;
}

const templates: Record<string, (data: Record<string, unknown>) => TemplateResult> = {
  new_lead: (d) => {
    const name = String(d.full_name ?? "");
    const service = String(d.service ?? "");
    return {
      subject: `New Zyntiqo Enquiry — ${name} — ${service}`,
      html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Enquiry Received</h2>
<p style="margin:0 0 16px;color:#94a3b8;">A new enquiry has been submitted through the Zyntiqo website.</p>
${infoTable([
  ["Full Name", name],
  ["Business Name", String(d.business_name ?? "—")],
  ["Email", String(d.email ?? "—")],
  ["Phone", String(d.phone ?? "—")],
  ["WhatsApp", String(d.whatsapp ?? "—")],
  ["Service / Requirement", service],
  ["Budget Range", String(d.budget ?? "—")],
  ["Project Timeline", String(d.timeline ?? "—")],
  ["Project Description", String(d.requirements ?? "—")],
  ["Submission Date/Time", String(d.submitted_at ?? new Date().toLocaleString())],
])}
<p style="margin:24px 0 0;color:#64748b;font-size:12px;">Lead ID: ${String(d.lead_id ?? "—")}</p>
`),
    };
  },

  enquiry_confirmation: (d) => {
    const name = String(d.full_name ?? "there");
    return {
      subject: `We've received your enquiry — Zyntiqo`,
      html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Hi ${name},</h2>
<p style="margin:0 0 16px;color:#94a3b8;">Thank you for contacting Zyntiqo! We've received your enquiry and our team is reviewing it now.</p>
<p style="margin:0 0 12px;color:#cbd5e1;">Here's what happens next:</p>
<ul style="margin:0 0 16px;padding-left:20px;color:#cbd5e1;">
<li style="margin-bottom:8px;">Our team will review your requirements within one business day.</li>
<li style="margin-bottom:8px;">We'll reach out via email or WhatsApp to discuss your project in detail.</li>
<li style="margin-bottom:8px;">You'll receive a tailored proposal aligned with your goals and budget.</li>
</ul>
<p style="margin:16px 0;color:#cbd5e1;">If you have any urgent questions, feel free to reach us at <a href="mailto:wecare@zyntiqo.com" style="color:#22d3ee;text-decoration:none;">wecare@zyntiqo.com</a>.</p>
<p style="margin:24px 0 0;color:#64748b;font-size:13px;">Best regards,<br/>The Zyntiqo Team</p>
`),
    };
  },

  consultation_request: (d) => ({
    subject: `New Consultation Request — ${String(d.name ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Consultation Request</h2>
${infoTable([
  ["Name", String(d.name ?? "—")],
  ["Service", String(d.service ?? "—")],
  ["Date", String(d.date ?? "—")],
  ["Time", String(d.time ?? "—")],
])}
`),
  }),

  quote_request: (d) => ({
    subject: `New Quote Request — ${String(d.name ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Quote Request</h2>
${infoTable([
  ["Name", String(d.name ?? "—")],
  ["Email", String(d.email ?? "—")],
  ["Service", String(d.service ?? "—")],
  ["Requirements", String(d.requirements ?? "—")],
  ["Budget", String(d.budget ?? "—")],
  ["Timeline", String(d.timeline ?? "—")],
])}
`),
  }),

  quote_approved: (d) => ({
    subject: `Quote Approved — ${String(d.quote_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Quote Approved by Customer</h2>
${infoTable([
  ["Quote Number", String(d.quote_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Approved At", String(d.approved_at ?? new Date().toLocaleString())],
])}
`),
  }),

  quote_rejected: (d) => ({
    subject: `Quote Rejected — ${String(d.quote_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Quote Rejected by Customer</h2>
${infoTable([
  ["Quote Number", String(d.quote_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Rejected At", String(d.rejected_at ?? new Date().toLocaleString())],
])}
`),
  }),

  support_ticket: (d) => ({
    subject: `New Support Ticket — ${String(d.subject ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Support Ticket</h2>
${infoTable([
  ["Ticket ID", String(d.ticket_id ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Subject", String(d.subject ?? "—")],
  ["Priority", String(d.priority ?? "—")],
  ["Description", String(d.description ?? "—")],
])}
`),
  }),

  ticket_reply: (d) => ({
    subject: `Ticket Reply — ${String(d.subject ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Ticket Reply</h2>
${infoTable([
  ["Ticket ID", String(d.ticket_id ?? "—")],
  ["From", String(d.author ?? "—")],
  ["Subject", String(d.subject ?? "—")],
  ["Message", String(d.message ?? "—")],
])}
`),
  }),

  meeting_booked: (d) => ({
    subject: `Meeting Confirmed — ${String(d.meeting_title ?? "Zyntiqo Consultation")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Meeting Booked</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Timezone", String(d.timezone ?? "—")],
  ["Type", String(d.meeting_type ?? "—")],
])}
`),
  }),

  meeting_cancelled: (d) => ({
    subject: `Meeting Cancelled — ${String(d.meeting_title ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Meeting Cancelled</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Cancelled At", String(d.cancelled_at ?? new Date().toLocaleString())],
])}
`),
  }),

  meeting_reminder: (d) => ({
    subject: `Meeting Reminder — ${String(d.meeting_title ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Upcoming Meeting Reminder</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Timezone", String(d.timezone ?? "—")],
])}
`),
  }),

  invoice_created: (d) => ({
    subject: `Invoice Created — ${String(d.invoice_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Invoice</h2>
${infoTable([
  ["Invoice Number", String(d.invoice_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Due Date", String(d.due_date ?? "—")],
])}
`),
  }),

  payment_confirmation: (d) => ({
    subject: `Payment Received — ${String(d.invoice_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Payment Confirmation</h2>
${infoTable([
  ["Invoice", String(d.invoice_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Method", String(d.method ?? "—")],
  ["Paid At", String(d.paid_at ?? new Date().toLocaleString())],
])}
`),
  }),
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "RESEND_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const body: EmailRequest = await req.json();
    if (!body.to || !body.template) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: to, template" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const builder = templates[body.template];
    if (!builder) {
      return new Response(
        JSON.stringify({ ok: false, error: `Unknown template: ${body.template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { subject, html } = builder(body.data);

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: body.to,
      subject,
      html,
    });

    if (error) {
      console.error("[send-email] Resend error:", error.message);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

type EmailRequest = {
  to: string;
  template: string;
  data: Record<string, unknown>;
};

type TemplateResult = { subject: string; html: string };

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Zyntiqo</title>
</head>
<body style="margin:0;padding:0;background:#060a12;font-family:Inter,system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060a12;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0a0f1a;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
<h1 style="margin:0;font-size:22px;font-weight:700;color:#22d3ee;letter-spacing:-0.02em;">Zyntiqo</h1>
<p style="margin:4px 0 0;font-size:12px;color:#64748b;letter-spacing:0.05em;text-transform:uppercase;">Build. Grow. Automate.</p>
</td></tr>
<tr><td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.6;">
${content}
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
<p style="margin:0;font-size:12px;color:#64748b;">This email was sent by Zyntiqo. Visit us at <a href="https://www.zyntiqo.com" style="color:#22d3ee;text-decoration:none;">www.zyntiqo.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function fieldRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:160px;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:500;">${value}</td></tr>`;
}

function infoTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">${rows.map(([l, v]) => fieldRow(l, v)).join("")}</table>`;
}

const templates: Record<string, (data: Record<string, unknown>) => TemplateResult> = {
  new_lead: (d) => {
    const name = String(d.full_name ?? "");
    const service = String(d.service ?? "");
    return {
      subject: `New Zyntiqo Enquiry — ${name} — ${service}`,
      html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Enquiry Received</h2>
<p style="margin:0 0 16px;color:#94a3b8;">A new enquiry has been submitted through the Zyntiqo website.</p>
${infoTable([
  ["Full Name", name],
  ["Business Name", String(d.business_name ?? "—")],
  ["Email", String(d.email ?? "—")],
  ["Phone", String(d.phone ?? "—")],
  ["WhatsApp", String(d.whatsapp ?? "—")],
  ["Service / Requirement", service],
  ["Budget Range", String(d.budget ?? "—")],
  ["Project Timeline", String(d.timeline ?? "—")],
  ["Project Description", String(d.requirements ?? "—")],
  ["Submission Date/Time", String(d.submitted_at ?? new Date().toLocaleString())],
])}
<p style="margin:24px 0 0;color:#64748b;font-size:12px;">Lead ID: ${String(d.lead_id ?? "—")}</p>
`),
    };
  },

  enquiry_confirmation: (d) => {
    const name = String(d.full_name ?? "there");
    return {
      subject: `We've received your enquiry — Zyntiqo`,
      html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Hi ${name},</h2>
<p style="margin:0 0 16px;color:#94a3b8;">Thank you for contacting Zyntiqo! We've received your enquiry and our team is reviewing it now.</p>
<p style="margin:0 0 12px;color:#cbd5e1;">Here's what happens next:</p>
<ul style="margin:0 0 16px;padding-left:20px;color:#cbd5e1;">
<li style="margin-bottom:8px;">Our team will review your requirements within one business day.</li>
<li style="margin-bottom:8px;">We'll reach out via email or WhatsApp to discuss your project in detail.</li>
<li style="margin-bottom:8px;">You'll receive a tailored proposal aligned with your goals and budget.</li>
</ul>
<p style="margin:16px 0;color:#cbd5e1;">If you have any urgent questions, feel free to reach us at <a href="mailto:wecare@zyntiqo.com" style="color:#22d3ee;text-decoration:none;">wecare@zyntiqo.com</a>.</p>
<p style="margin:24px 0 0;color:#64748b;font-size:13px;">Best regards,<br/>The Zyntiqo Team</p>
`),
    };
  },

  consultation_request: (d) => ({
    subject: `New Consultation Request — ${String(d.name ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Consultation Request</h2>
${infoTable([
  ["Name", String(d.name ?? "—")],
  ["Service", String(d.service ?? "—")],
  ["Date", String(d.date ?? "—")],
  ["Time", String(d.time ?? "—")],
])}
`),
  }),

  quote_request: (d) => ({
    subject: `New Quote Request — ${String(d.name ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Quote Request</h2>
${infoTable([
  ["Name", String(d.name ?? "—")],
  ["Email", String(d.email ?? "—")],
  ["Service", String(d.service ?? "—")],
  ["Requirements", String(d.requirements ?? "—")],
  ["Budget", String(d.budget ?? "—")],
  ["Timeline", String(d.timeline ?? "—")],
])}
`),
  }),

  quote_approved: (d) => ({
    subject: `Quote Approved — ${String(d.quote_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Quote Approved by Customer</h2>
${infoTable([
  ["Quote Number", String(d.quote_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Approved At", String(d.approved_at ?? new Date().toLocaleString())],
])}
`),
  }),

  quote_rejected: (d) => ({
    subject: `Quote Rejected — ${String(d.quote_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Quote Rejected by Customer</h2>
${infoTable([
  ["Quote Number", String(d.quote_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Rejected At", String(d.rejected_at ?? new Date().toLocaleString())],
])}
`),
  }),

  support_ticket: (d) => ({
    subject: `New Support Ticket — ${String(d.subject ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Support Ticket</h2>
${infoTable([
  ["Ticket ID", String(d.ticket_id ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Subject", String(d.subject ?? "—")],
  ["Priority", String(d.priority ?? "—")],
  ["Description", String(d.description ?? "—")],
])}
`),
  }),

  ticket_reply: (d) => ({
    subject: `Ticket Reply — ${String(d.subject ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Ticket Reply</h2>
${infoTable([
  ["Ticket ID", String(d.ticket_id ?? "—")],
  ["From", String(d.author ?? "—")],
  ["Subject", String(d.subject ?? "—")],
  ["Message", String(d.message ?? "—")],
])}
`),
  }),

  meeting_booked: (d) => ({
    subject: `Meeting Confirmed — ${String(d.meeting_title ?? "Zyntiqo Consultation")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Meeting Booked</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Timezone", String(d.timezone ?? "—")],
  ["Type", String(d.meeting_type ?? "—")],
])}
`),
  }),

  meeting_cancelled: (d) => ({
    subject: `Meeting Cancelled — ${String(d.meeting_title ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Meeting Cancelled</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Cancelled At", String(d.cancelled_at ?? new Date().toLocaleString())],
])}
`),
  }),

  meeting_reminder: (d) => ({
    subject: `Meeting Reminder — ${String(d.meeting_title ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Upcoming Meeting Reminder</h2>
${infoTable([
  ["Title", String(d.meeting_title ?? "—")],
  ["Date", String(d.meeting_date ?? "—")],
  ["Time", String(d.meeting_time ?? "—")],
  ["Timezone", String(d.timezone ?? "—")],
])}
`),
  }),

  invoice_created: (d) => ({
    subject: `Invoice Created — ${String(d.invoice_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">New Invoice</h2>
${infoTable([
  ["Invoice Number", String(d.invoice_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Due Date", String(d.due_date ?? "—")],
])}
`),
  }),

  payment_confirmation: (d) => ({
    subject: `Payment Received — ${String(d.invoice_number ?? "")}`,
    html: wrapHtml(`
<h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Payment Confirmation</h2>
${infoTable([
  ["Invoice", String(d.invoice_number ?? "—")],
  ["Customer", String(d.customer_name ?? "—")],
  ["Amount", String(d.amount ?? "—")],
  ["Method", String(d.method ?? "—")],
  ["Paid At", String(d.paid_at ?? new Date().toLocaleString())],
])}
`),
  }),
};

try {
  const body: EmailRequest = await req.json();
  if (!body.to || !body.template) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required fields: to, template" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const builder = templates[body.template];
  if (!builder) {
    return new Response(
      JSON.stringify({ ok: false, error: `Unknown template: ${body.template}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { subject, html } = builder(body.data);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: body.to,
    subject,
    html,
  });

  if (error) {
    console.error("[send-email] Resend error:", error.message);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, id: data?.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
} catch (err) {
  console.error("[send-email] Unexpected error:", err);
  return new Response(
    JSON.stringify({ ok: false, error: "Internal server error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
