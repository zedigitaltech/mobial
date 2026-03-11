export interface TroubleshootingNode {
  id: string
  title: string
  description?: string
  options?: Array<{
    label: string
    nextId: string
  }>
  solution?: {
    title: string
    steps: string[]
    contactSupport?: boolean
  }
}

export const troubleshootingTree: Record<string, TroubleshootingNode> = {
  start: {
    id: "start",
    title: "What issue are you experiencing?",
    description: "Select the issue that best describes your problem.",
    options: [
      { label: "eSIM won't activate", nextId: "activation" },
      { label: "No data connection", nextId: "no-data" },
      { label: "Slow connection speed", nextId: "slow-speed" },
      { label: "Can't find my QR code", nextId: "qr-code" },
      { label: "Top-up not working", nextId: "topup-issue" },
      { label: "Other issue", nextId: "other" },
    ],
  },

  // ===== ACTIVATION ISSUES =====
  activation: {
    id: "activation",
    title: "eSIM won't activate",
    description: "Let's narrow down the activation issue.",
    options: [
      { label: "QR code won't scan", nextId: "qr-scan-fail" },
      { label: "Error during installation", nextId: "install-error" },
      { label: "eSIM installed but no signal", nextId: "no-signal" },
      { label: "Device says eSIM not supported", nextId: "not-supported" },
    ],
  },

  "qr-scan-fail": {
    id: "qr-scan-fail",
    title: "QR Code Won't Scan",
    solution: {
      title: "Fix QR Code Scanning Issues",
      steps: [
        "Make sure you're scanning the QR code from a different screen (not the same device).",
        "Increase screen brightness on the device showing the QR code.",
        "Try scanning in a well-lit area without screen glare.",
        "If scanning from email, try zooming in on the QR code.",
        "As an alternative, go to Settings > Cellular > Add eSIM > Enter Details Manually, and use the activation code from your email.",
        "If the QR code still won't work, contact support with your order number.",
      ],
      contactSupport: true,
    },
  },

  "install-error": {
    id: "install-error",
    title: "Error During Installation",
    solution: {
      title: "Resolve Installation Errors",
      steps: [
        "Ensure you have a stable Wi-Fi or cellular connection during installation.",
        "Restart your device and try again.",
        "Check that your device software is up to date (Settings > General > Software Update).",
        "Remove any existing eSIM profiles that are no longer in use.",
        "Make sure you haven't already installed this eSIM — each QR code can only be used once.",
        "Try using the manual activation code instead of the QR code.",
      ],
      contactSupport: true,
    },
  },

  "no-signal": {
    id: "no-signal",
    title: "eSIM installed but no signal",
    solution: {
      title: "Get Signal After eSIM Installation",
      steps: [
        "Toggle Airplane Mode on, wait 10 seconds, then toggle it off.",
        "Go to Settings > Cellular and make sure the eSIM line is turned ON.",
        "Set the eSIM as the primary data line: Settings > Cellular > Cellular Data > select your eSIM.",
        "Enable Data Roaming: Settings > Cellular > [eSIM line] > Data Roaming > ON.",
        "If the plan activates on 'first use', you may need to be in the destination country.",
        "Try manually selecting a network: Settings > Cellular > Network Selection > turn off Automatic and select a carrier.",
      ],
    },
  },

  "not-supported": {
    id: "not-supported",
    title: "Device Says eSIM Not Supported",
    solution: {
      title: "Check eSIM Compatibility",
      steps: [
        "Verify your device supports eSIM by checking our Compatible Devices page.",
        "Carrier-locked devices may not support third-party eSIMs. Contact your carrier to check.",
        "Some devices require a software update to enable eSIM functionality.",
        "For iPhones: Settings > General > About — check if 'Digital SIM' or 'eSIM' appears.",
        "For Android: Settings > Connections > SIM Manager — look for 'Add eSIM' option.",
        "If your device is listed as compatible but still shows this error, try restarting your device.",
      ],
      contactSupport: true,
    },
  },

  // ===== NO DATA CONNECTION =====
  "no-data": {
    id: "no-data",
    title: "No data connection",
    description: "Your eSIM is installed but data isn't working.",
    options: [
      { label: "Never had data since installing", nextId: "never-connected" },
      { label: "Data stopped working suddenly", nextId: "data-stopped" },
      { label: "Data works but not in current location", nextId: "location-issue" },
    ],
  },

  "never-connected": {
    id: "never-connected",
    title: "Never Had Data Connection",
    solution: {
      title: "Establish Initial Data Connection",
      steps: [
        "Toggle Airplane Mode on and off.",
        "Ensure Data Roaming is enabled: Settings > Cellular > [eSIM line] > Data Roaming > ON.",
        "Set the eSIM as your data line: Settings > Cellular > Cellular Data > select eSIM.",
        "Check if the plan requires you to be in the destination country to activate.",
        "Reset network settings: Settings > General > Transfer or Reset > Reset Network Settings.",
        "Wait a few minutes — some plans take up to 15 minutes to activate after installation.",
      ],
      contactSupport: true,
    },
  },

  "data-stopped": {
    id: "data-stopped",
    title: "Data Stopped Working",
    solution: {
      title: "Restore Data Connection",
      steps: [
        "Check your data usage — you may have used all your data. Check at mobialo.eu/check-usage.",
        "Toggle Airplane Mode on and off.",
        "Restart your device.",
        "Check if Data Roaming is still enabled.",
        "Try manually selecting a different network carrier.",
        "If your data is exhausted, you can top up at mobialo.eu/topup.",
      ],
    },
  },

  "location-issue": {
    id: "location-issue",
    title: "Data Not Working in Current Location",
    solution: {
      title: "Fix Location-Based Data Issues",
      steps: [
        "Verify your plan covers the country you're currently in.",
        "Some areas (rural, underground, remote) may have limited coverage.",
        "Try manually selecting a different carrier: Settings > Cellular > Network Selection.",
        "Move to an area with better coverage and try again.",
        "If the country should be covered, toggle Airplane Mode and try connecting again.",
      ],
      contactSupport: true,
    },
  },

  // ===== SLOW SPEED =====
  "slow-speed": {
    id: "slow-speed",
    title: "Slow connection speed",
    solution: {
      title: "Improve Connection Speed",
      steps: [
        "Check if you've exceeded a data threshold — some plans throttle speed after a certain amount.",
        "Try manually selecting a different carrier for potentially better speeds.",
        "Toggle Airplane Mode to force a network reconnection.",
        "Avoid peak usage times (evenings) when networks tend to be congested.",
        "Check if your device is connected to the correct network type (4G/LTE preferred over 3G).",
        "Reset APN settings: Settings > Cellular > [eSIM] > Cellular Data Network > Reset.",
        "Note: International IP routing may add latency. This is normal for roaming eSIMs.",
      ],
    },
  },

  // ===== QR CODE =====
  "qr-code": {
    id: "qr-code",
    title: "Can't find my QR code",
    solution: {
      title: "Find Your eSIM QR Code",
      steps: [
        "Check your email inbox (including spam/junk folders) for an email from MobiaL.",
        "Log in to your MobiaL account and go to 'My Orders' to view your eSIM details.",
        "The QR code is sent to the email address used during checkout.",
        "If you used guest checkout, check the email you entered during purchase.",
        "If you still can't find it, contact support with your order number.",
      ],
      contactSupport: true,
    },
  },

  // ===== TOP-UP =====
  "topup-issue": {
    id: "topup-issue",
    title: "Top-up not working",
    solution: {
      title: "Resolve Top-Up Issues",
      steps: [
        "Verify the top-up product is compatible with your existing eSIM plan.",
        "Not all plans support top-ups. Check your plan details for 'Top-Up Available'.",
        "If payment was completed but data wasn't added, wait 5-10 minutes and check usage.",
        "Ensure you entered the correct ICCID or order number during the top-up process.",
        "Try restarting your device after the top-up to refresh the data balance.",
        "If the issue persists, contact support with both your original order number and top-up order number.",
      ],
      contactSupport: true,
    },
  },

  // ===== OTHER =====
  other: {
    id: "other",
    title: "Other Issue",
    solution: {
      title: "Contact Our Support Team",
      steps: [
        "Check our FAQ page for common questions and answers.",
        "Email us at support@mobialo.eu with your order number and a description of the issue.",
        "Include screenshots if possible — they help us resolve issues faster.",
        "Our support team typically responds within 24 hours.",
      ],
      contactSupport: true,
    },
  },
}
