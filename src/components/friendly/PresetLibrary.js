/**
 * Preset automation catalogue.
 * Each entry is a one-tap automation a tenant can activate.
 * When selected, the UI POSTs to eternium-api admin endpoints
 * to create the trigger + routing rules with preset_key recorded.
 */

export const presetLibrary = [
  {
    id: 'morning-revenue-digest',
    display_name: 'Morning revenue digest',
    description: "Every morning at 7, get a one-line summary of yesterday's revenue and any deals that closed.",
    category: 'finance',
    icon: 'trending-up',
    trigger_template: {
      trigger_key: 'morning_revenue_digest',
      cron_expr: '0 13 * * *',
      prompt_template: "Summarize yesterday's total revenue, compare to the prior day, and list any deals that closed. Keep it to 2-3 sentences.",
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'daily-summary' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'new-customer-signup',
    display_name: 'New customer signup',
    description: 'Get notified when a new customer signs up. Includes their name and signup source.',
    category: 'customer',
    icon: 'user-plus',
    trigger_template: {
      trigger_key: 'new_customer_signup',
      cron_expr: null,
      prompt_template: 'A new customer just signed up. Summarize who they are and how they found us.',
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'buzz-immediately' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'sales-drop-alert',
    display_name: 'Sales drop alert',
    description: "When yesterday's sales drop more than 30% vs the prior week, flag it immediately.",
    category: 'finance',
    icon: 'trending-down',
    trigger_template: {
      trigger_key: 'sales_drop_alert',
      cron_expr: '0 14 * * *',
      prompt_template: "Compare yesterday's sales total to the same day last week. If it dropped by 30% or more, explain the drop and suggest possible causes.",
      default_severity: 'P1',
    },
    routing_template: {
      telegram: { preset_key: 'emergencies-only' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'daily-business-audit',
    display_name: 'Daily business audit',
    description: 'A comprehensive daily check-in covering revenue, operations, and anything that needs your attention.',
    category: 'operations',
    icon: 'clipboard-check',
    trigger_template: {
      trigger_key: 'daily_audit',
      cron_expr: '0 13 * * *',
      prompt_template: "Run a full daily audit: revenue summary, open tasks, overdue items, anything that needs the owner's attention. Keep it concise and actionable.",
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'daily-summary' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'weekly-marketing-recap',
    display_name: 'Weekly marketing recap',
    description: 'Every Friday, get a summary of the week in marketing: reach, engagement, and top-performing content.',
    category: 'marketing',
    icon: 'bar-chart',
    trigger_template: {
      trigger_key: 'weekly_marketing_recap',
      cron_expr: '0 15 * * 5',
      prompt_template: "Summarize this week's marketing performance: total reach, engagement rate, top 3 performing posts, and ad spend vs returns.",
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'weekly-summary' },
      inbox: { preset_key: 'daily-summary' },
    },
  },
  {
    id: 'ad-spend-cap-reached',
    display_name: 'Ad spend cap reached',
    description: 'Get an alert when your ad budget is 90% spent so you can decide whether to top up or pause.',
    category: 'marketing',
    icon: 'alert-circle',
    trigger_template: {
      trigger_key: 'ad_spend_cap',
      cron_expr: '0 */4 * * *',
      prompt_template: 'Check current ad spend against the budget cap. If spend is at or above 90%, alert the owner with current spend, remaining budget, and a recommendation.',
      default_severity: 'P1',
    },
    routing_template: {
      telegram: { preset_key: 'emergencies-only' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'workspace-storage-filling',
    display_name: 'Workspace storage filling up',
    description: 'Warns you when your workspace storage is above 80% so you can clean up or upgrade.',
    category: 'operations',
    icon: 'hard-drive',
    trigger_template: {
      trigger_key: 'storage_warning',
      cron_expr: '0 14 * * 1',
      prompt_template: 'Check workspace storage usage. If above 80%, list the largest items and suggest what can be archived or removed.',
      default_severity: 'P1',
    },
    routing_template: {
      telegram: { preset_key: 'emergencies-only' },
      inbox: { preset_key: 'daily-summary' },
    },
  },
  {
    id: 'customer-feedback-received',
    display_name: 'Customer feedback received',
    description: 'Get notified when a customer leaves feedback, with a quick sentiment summary.',
    category: 'customer',
    icon: 'message-circle',
    trigger_template: {
      trigger_key: 'customer_feedback',
      cron_expr: null,
      prompt_template: 'A customer just left feedback. Summarize the sentiment (positive, neutral, or negative), quote the key point, and suggest a follow-up action if needed.',
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'daily-summary' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'mercury-balance-low',
    display_name: 'Mercury balance below threshold',
    description: 'Alerts you when your Mercury bank balance drops below a threshold you set.',
    category: 'finance',
    icon: 'dollar-sign',
    trigger_template: {
      trigger_key: 'mercury_balance_low',
      cron_expr: '0 14 * * *',
      prompt_template: 'Check the Mercury account balance. If it is below the configured threshold, alert the owner with the current balance, recent large transactions, and runway estimate.',
      default_severity: 'P0',
    },
    routing_template: {
      telegram: { preset_key: 'buzz-immediately' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'stripe-payment-failed',
    display_name: 'Stripe payment failed',
    description: 'Instant alert when a customer payment fails, with details and suggested next steps.',
    category: 'finance',
    icon: 'credit-card',
    trigger_template: {
      trigger_key: 'stripe_payment_failed',
      cron_expr: null,
      prompt_template: 'A Stripe payment just failed. Identify the customer, the amount, the failure reason, and suggest a recovery action (retry, reach out, etc.).',
      default_severity: 'P1',
    },
    routing_template: {
      telegram: { preset_key: 'emergencies-only' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
  {
    id: 'blog-post-needs-approval',
    display_name: 'New blog post needs approval',
    description: 'When a draft blog post is ready for review, get a notification with a preview link.',
    category: 'marketing',
    icon: 'file-text',
    trigger_template: {
      trigger_key: 'blog_approval_needed',
      cron_expr: null,
      prompt_template: 'A new blog post draft is ready for review. Summarize the title, topic, word count, and include the preview link.',
      default_severity: 'P2',
    },
    routing_template: {
      telegram: { preset_key: 'daily-summary' },
      inbox: { preset_key: 'buzz-immediately' },
    },
  },
];
