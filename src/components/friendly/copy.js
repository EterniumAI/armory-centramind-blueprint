/**
 * Centralized friendly copy strings.
 * Every customer-facing label, helper text, button label, and status string
 * lives here so copy iteration never requires hunting through components.
 */

export const friendlyCopy = {
  schedule: {
    sectionLabel: 'When should this run?',
    presets: {
      'every-hour': 'Every hour',
      'daily-morning-7': 'Every morning at 7',
      'twice-daily': 'Twice a day (7 AM + 5 PM)',
      'weekly-friday': 'Weekly on Friday at 9 AM',
      'monthly-first': 'Monthly on the 1st at 8 AM',
      custom: 'Custom...',
    },
    frequencyLabel: 'How often',
    timeLabel: 'What time',
    dayOfWeekLabel: 'Which days',
    dayOfMonthLabel: 'Day of the month',
    frequencies: {
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    days: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    },
    humanPrefix: 'This will run',
    timezoneSuffix: 'in your time zone',
  },

  urgency: {
    sectionLabel: 'How urgent is this when it happens?',
    levels: {
      wake: 'Wake me up',
      flag: 'Worth flagging',
      know: 'Worth knowing',
      log: 'Just for the log',
    },
  },

  repeat: {
    sectionLabel: 'If this happens again soon, should we tell you again?',
    presets: {
      always: 'Always (every time)',
      '1h': "Don't repeat for 1 hour",
      '6h': "Don't repeat for 6 hours",
      '24h': "Don't repeat for 24 hours",
      custom: 'Custom...',
    },
    unitLabel: 'How long to wait',
    units: {
      minutes: 'Minutes',
      hours: 'Hours',
      days: 'Days',
    },
  },

  notification: {
    questionPrefix: 'How do you want this in',
    channelNames: {
      telegram: 'Telegram',
      inbox: 'Inbox',
      email: 'Email',
    },
    presets: {
      'buzz-immediately': {
        title: 'Buzz me right away',
        description: 'Every alert sends a notification, even small ones.',
      },
      'daily-summary': {
        title: 'Daily summary at 7 AM, but flag emergencies right away',
        description:
          'Most stuff lands in one daily summary. Anything truly urgent still wakes you.',
        recommended: true,
      },
      'weekly-summary': {
        title: 'Weekly summary on Fridays',
        description: 'One roundup per week. Nothing else.',
      },
      'emergencies-only': {
        title: 'Only emergencies wake me',
        description: 'Big alerts get a notification. Small stuff stays quiet.',
      },
      quiet: {
        title: 'Quiet (just the inbox)',
        description: 'Nothing leaves the inbox. You decide when to check.',
      },
    },
    moreOptions: 'More options...',
    fewerOptions: 'Fewer options',
  },

  status: {
    sending: 'Sending',
    sent: 'Sent',
    inDailySummary: 'In daily summary',
    skippedDuplicate: 'Skipped (duplicate)',
    loggedOnly: 'Logged only',
    skippedNotUrgent: 'Skipped (not urgent enough)',
    couldNotDeliver: "Couldn't deliver",
    connected: 'Connected',
    paused: 'Paused',
    needsAttention: 'Needs attention',
    on: 'On',
    off: 'Off',
  },

  actions: {
    save: 'Save',
    cancel: 'Cancel',
    testNow: 'Test now',
    addNew: 'Add new',
    remove: 'Remove',
    edit: 'Edit',
    enable: 'Turn on',
    disable: 'Turn off',
  },

  errors: {
    deliveryFailed: "We couldn't deliver this notification. Check the channel connection and try again.",
    channelDisconnected: 'This channel lost its connection. Reconnect it to resume notifications.',
    unknownError: 'Something went wrong. Try again in a moment.',
  },
};
