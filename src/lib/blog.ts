export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  category: string
  readTime: string
  coverImage?: string
}

export const BLOG_CATEGORIES = ["All", "Travel", "Guides", "Tips", "General"] as const
export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export const blogPosts: BlogPost[] = [
  {
    slug: "what-is-an-esim",
    title: "What is an eSIM? Everything You Need to Know",
    excerpt:
      "Discover how embedded SIM technology is transforming mobile connectivity, eliminating physical SIM cards, and making it easier than ever to stay connected globally.",
    author: "MobiaL Team",
    publishedAt: "2026-02-15",
    category: "General",
    readTime: "6 min read",
    content: `
      <p>If you've purchased a smartphone in the last few years, you've probably heard the term "eSIM" thrown around. But what exactly is an eSIM, and why is it such a big deal for travelers and everyday users alike?</p>

      <h2>The Basics: eSIM Explained</h2>
      <p>An eSIM (embedded SIM) is a small chip built directly into your device during manufacturing. Unlike a traditional SIM card that you physically insert into a tray, an eSIM is soldered onto the motherboard and can be programmed remotely. Think of it as a digital SIM card — same functionality, no plastic.</p>
      <p>When you activate an eSIM, your carrier sends a profile over the air that configures the chip with your phone number, data plan, and network credentials. This all happens within seconds through a QR code scan or a carrier app.</p>

      <h2>How Does an eSIM Work?</h2>
      <p>The eSIM follows a standard developed by the GSMA (the global trade body for mobile operators). Here's the simplified flow:</p>
      <ol>
        <li><strong>Purchase a plan</strong> — You choose a data plan from a provider like MobiaL.</li>
        <li><strong>Receive a QR code</strong> — The provider generates a unique QR code tied to your plan.</li>
        <li><strong>Scan and install</strong> — Your phone reads the QR code and downloads the carrier profile.</li>
        <li><strong>Activate</strong> — The eSIM profile is stored on the chip, and you're connected.</li>
      </ol>
      <p>Most modern devices can store multiple eSIM profiles simultaneously, meaning you can switch between carriers or plans without ever opening a SIM tray.</p>

      <h2>Which Devices Support eSIM?</h2>
      <p>eSIM support has expanded rapidly. As of 2026, compatible devices include:</p>
      <ul>
        <li>Apple iPhone XS and later (iPhone 16 series is eSIM-only in the US)</li>
        <li>Samsung Galaxy S21 and later, Galaxy Z Fold/Flip series</li>
        <li>Google Pixel 3 and later</li>
        <li>iPad Pro, iPad Air, and iPad mini (Wi-Fi + Cellular models)</li>
        <li>Apple Watch Series 3 and later (cellular models)</li>
        <li>Select Windows laptops with LTE/5G connectivity</li>
      </ul>

      <h2>Why eSIM Matters</h2>
      <p>For travelers, the eSIM is a game-changer. Instead of hunting for a local SIM card at a foreign airport kiosk, you can purchase and activate a data plan before you even board your flight. No more fumbling with tiny SIM trays, no risk of losing your home SIM, and no surprise roaming charges.</p>
      <p>Beyond travel, eSIMs simplify carrier switching, enable dual-SIM setups on phones with a single physical slot, and reduce e-waste by eliminating plastic SIM cards entirely. As the mobile industry moves toward a fully digital future, the eSIM is the foundation.</p>

      <h2>Getting Started</h2>
      <p>Ready to try an eSIM? Check if your device is compatible, then browse data plans on MobiaL for your next destination. The entire setup takes under two minutes — and you'll never look back at physical SIMs again.</p>
    `,
  },
  {
    slug: "top-10-countries-digital-nomads-2026",
    title: "Top 10 Countries for Digital Nomads in 2026",
    excerpt:
      "From visa-friendly policies to fast internet and low cost of living, these are the best countries for remote workers looking to live and work abroad this year.",
    author: "MobiaL Team",
    publishedAt: "2026-02-28",
    category: "Travel",
    readTime: "8 min read",
    content: `
      <p>The digital nomad lifestyle has gone from niche trend to mainstream movement. Governments around the world now compete to attract remote workers with dedicated visa programs, coworking infrastructure, and tax incentives. Here are the ten best countries for digital nomads in 2026.</p>

      <h2>1. Portugal</h2>
      <p>Lisbon and Porto remain the top picks in Europe. Portugal's D7 and Digital Nomad visas offer straightforward residency paths. Average coworking costs run about 150 EUR/month, the food scene is world-class, and fiber internet is widespread even in smaller cities. The time zone (GMT/GMT+1) is ideal for working with both US and European clients.</p>

      <h2>2. Thailand</h2>
      <p>Thailand's Long-Term Resident (LTR) visa and the newer Digital Nomad Visa make it easier than ever to stay legally. Bangkok and Chiang Mai offer ultra-fast internet, a massive coworking community, and a cost of living that lets you live well on $1,500/month. Street food alone is worth the move.</p>

      <h2>3. Mexico</h2>
      <p>Mexico City, Playa del Carmen, and Oaxaca have become digital nomad hubs. No special visa is needed for stays under 180 days. The proximity to US time zones, excellent coffee culture, and growing tech scene make it a favorite for North American remote workers.</p>

      <h2>4. Colombia</h2>
      <p>Medellin's spring-like climate, affordable cost of living, and vibrant coworking scene earned it the nickname "Silicon Valley of South America." Colombia's digital nomad visa allows stays of up to two years, and the country's improving infrastructure makes it a serious contender.</p>

      <h2>5. Estonia</h2>
      <p>The pioneer of e-Residency, Estonia continues to lead in digital governance. Tallinn offers blazing-fast internet, a startup-friendly ecosystem, and a digital nomad visa. The country's compact size means you can explore it entirely on weekends.</p>

      <h2>6. Indonesia (Bali)</h2>
      <p>Bali's Canggu and Ubud areas are legendary among remote workers. The new B211A remote worker visa formalizes what thousands were already doing. Expect world-class coworking spaces like Dojo, affordable villas, and a community that makes networking effortless.</p>

      <h2>7. Spain</h2>
      <p>Spain's Beckham Law and non-lucrative visa options have drawn remote workers to Barcelona, Valencia, and the Canary Islands. Fast internet, Mediterranean lifestyle, and excellent healthcare round out the appeal. The Canary Islands are especially popular for their tax advantages.</p>

      <h2>8. Georgia</h2>
      <p>Tbilisi offers one of the best value propositions anywhere. Citizens of most countries can stay visa-free for a full year. Rent a furnished apartment for $400/month, enjoy some of the world's oldest wine traditions, and work from cafes with 100 Mbps connections.</p>

      <h2>9. Japan</h2>
      <p>Japan's 2025 digital nomad visa opened up six-month stays for remote workers. Tokyo and Osaka are obvious picks, but smaller cities like Fukuoka have dedicated startup support programs. The reliability of infrastructure — from trains to internet — is unmatched.</p>

      <h2>10. Croatia</h2>
      <p>Croatia's digital nomad visa exempts holders from local income tax for up to a year. Split and Dubrovnik offer stunning Adriatic coastlines, while Zagreb provides a more urban experience. EU membership means excellent connectivity and easy travel across Europe.</p>

      <h2>Stay Connected Wherever You Go</h2>
      <p>No matter which country you choose, reliable mobile data is essential. With a MobiaL eSIM, you can land in any of these destinations and be online instantly — no hunting for local SIM cards, no roaming surprises. Browse plans for your next destination and start your nomad journey connected.</p>
    `,
  },
  {
    slug: "esim-vs-physical-sim",
    title: "eSIM vs Physical SIM: Which is Better for Travel?",
    excerpt:
      "A detailed comparison of eSIM and traditional SIM cards for international travel, covering cost, convenience, coverage, and which option suits different traveler types.",
    author: "MobiaL Team",
    publishedAt: "2026-03-01",
    category: "Guides",
    readTime: "7 min read",
    content: `
      <p>Planning an international trip and wondering whether to go with an eSIM or a traditional physical SIM card? Both options will get you connected, but they differ significantly in convenience, cost, and flexibility. Let's break it down.</p>

      <h2>Convenience</h2>
      <p><strong>eSIM wins decisively here.</strong> You can purchase, download, and activate an eSIM from your couch days before your trip. No need to find a SIM vendor at the airport, wait in line, or deal with language barriers. The entire process takes about two minutes.</p>
      <p>With a physical SIM, you either need to order one in advance and wait for shipping, or buy one upon arrival. Airport kiosks often charge premium prices, and navigating an unfamiliar carrier's activation process in a foreign language can be frustrating.</p>

      <h2>Cost Comparison</h2>
      <p>Physical SIM cards from local carriers can be marginally cheaper for long stays because you're buying directly from the network operator. However, when you factor in the time spent acquiring one, the taxi to a carrier store, and the risk of getting an incompatible plan, the savings often evaporate.</p>
      <p>eSIM plans from providers like MobiaL are competitively priced and transparent. You see exactly what you're paying for — data amount, validity period, covered countries — before you buy. No hidden fees, no surprise charges. For trips under 30 days, eSIM plans are typically equal to or cheaper than local SIM options.</p>

      <h2>Coverage and Flexibility</h2>
      <p>A single eSIM plan can cover multiple countries. Traveling through Europe? One eSIM plan can keep you connected across 30+ countries without switching SIMs at each border. A physical SIM from one country typically only works in that country (unless it's an expensive roaming-enabled plan).</p>
      <p>eSIMs also let you keep your home number active. Since most modern phones support dual SIM (one physical + one eSIM, or two eSIMs), you can receive calls and texts on your regular number while using the eSIM for data. With a physical travel SIM, you'd need a dual-SIM phone or carry two devices.</p>

      <h2>Setup and Compatibility</h2>
      <p>Physical SIMs work with virtually any unlocked phone — even older models. The main requirement is that your phone is unlocked and supports the destination's network bands.</p>
      <p>eSIMs require a compatible device. Most phones released since 2020 support eSIM, but budget devices and some regional variants may not. Always check your device's compatibility before purchasing.</p>

      <h2>Security</h2>
      <p>eSIMs have an edge in security. Since they can't be physically removed, they're harder to tamper with. If your phone is stolen, the thief can't simply pop out the SIM to prevent tracking. Physical SIMs can be swapped out in seconds.</p>

      <h2>Environmental Impact</h2>
      <p>Every physical SIM card is a piece of plastic with embedded electronics. Multiply that by the billions of SIM cards manufactured annually, and the environmental impact adds up. eSIMs eliminate this waste entirely — no plastic, no packaging, no shipping.</p>

      <h2>The Verdict</h2>
      <p>For most travelers in 2026, the eSIM is the better choice. It's faster to set up, more flexible for multi-country trips, keeps your home number active, and costs about the same. Physical SIMs still make sense for long-term stays where you want a local number, or if your device doesn't support eSIM.</p>
      <p>The future is clearly digital. As more carriers and countries adopt eSIM technology, the gap will only widen.</p>
    `,
  },
  {
    slug: "save-money-international-data",
    title: "How to Save Money on International Data While Traveling",
    excerpt:
      "Practical strategies to avoid bill shock when traveling abroad, from eSIM plans and Wi-Fi optimization to carrier roaming alternatives.",
    author: "MobiaL Team",
    publishedAt: "2026-03-05",
    category: "Tips",
    readTime: "6 min read",
    content: `
      <p>International roaming charges can turn a dream vacation into a financial headache. A single day of unmanaged roaming can easily cost $50-100+. Here are proven strategies to stay connected abroad without emptying your wallet.</p>

      <h2>1. Use an eSIM Travel Plan</h2>
      <p>The most cost-effective solution for most travelers. An eSIM data plan lets you buy a specific amount of data for your destination at a fixed price — typically $5-30 for a week of travel, depending on the country and data amount. You activate it before departure and use it alongside your home SIM.</p>
      <p>Unlike carrier roaming packages, eSIM plans offer transparent pricing with no hidden fees. A 5GB plan for Europe might cost $12, while the same data through your home carrier's roaming could easily run $60+.</p>

      <h2>2. Disable Carrier Roaming Immediately</h2>
      <p>Before your plane lands, disable cellular data roaming in your phone's settings. This single step prevents accidental charges from background app activity, email syncing, and OS updates. On iPhone, go to Settings > Cellular > Cellular Data Options > Data Roaming (off). On Android, Settings > Network > Mobile Network > Data Roaming (off).</p>

      <h2>3. Download Offline Maps and Content</h2>
      <p>Before you leave home, download everything you'll need offline:</p>
      <ul>
        <li><strong>Google Maps / Apple Maps</strong> — Download maps for your destination cities</li>
        <li><strong>Translation apps</strong> — Download language packs for Google Translate</li>
        <li><strong>Entertainment</strong> — Download Netflix shows, Spotify playlists, podcasts</li>
        <li><strong>Travel guides</strong> — Save restaurant lists, attraction info, and itineraries offline</li>
      </ul>
      <p>These downloads use your home Wi-Fi, saving significant data abroad.</p>

      <h2>4. Optimize Your Phone's Data Usage</h2>
      <p>Even with an affordable eSIM plan, smart data habits stretch your gigabytes further:</p>
      <ul>
        <li>Disable automatic app updates over cellular</li>
        <li>Turn off background app refresh for non-essential apps</li>
        <li>Set photos and videos to upload only on Wi-Fi</li>
        <li>Use data compression in your browser (Chrome's Lite mode)</li>
        <li>Disable auto-play videos on social media</li>
      </ul>

      <h2>5. Leverage Hotel and Cafe Wi-Fi</h2>
      <p>Most hotels, cafes, airports, and restaurants offer free Wi-Fi. Use these connections for data-heavy tasks like video calls, uploading photos, and streaming. Save your mobile data for navigation and messaging on the go.</p>
      <p><strong>Security note:</strong> Always use a VPN on public Wi-Fi networks to protect your data. Free Wi-Fi networks are common targets for hackers.</p>

      <h2>6. Use Messaging Apps Instead of SMS</h2>
      <p>International SMS can cost $0.50-1.00 per message. Switch to data-based messaging apps like WhatsApp, Telegram, or iMessage (over data). Voice and video calls through these apps are also free over data, compared to $1-3/minute for international calls.</p>

      <h2>7. Consider Multi-Country Plans</h2>
      <p>If you're visiting multiple countries, a regional eSIM plan is far cheaper than buying separate local SIMs or activating roaming in each country. A single Europe-wide eSIM covers 30+ countries, and an Asia-Pacific plan might cover 15+ countries — all on one purchase.</p>

      <h2>The Bottom Line</h2>
      <p>The combination of an eSIM travel plan, smart data habits, and Wi-Fi usage can reduce your connectivity costs by 80-90% compared to carrier roaming. For a two-week European trip, that could mean spending $15-25 instead of $200+. Your wallet — and your vacation — will thank you.</p>
    `,
  },
  {
    slug: "esim-installation-guide-iphone-android",
    title: "Complete Guide to eSIM Installation on iPhone and Android",
    excerpt:
      "Step-by-step instructions for installing and activating an eSIM on both iPhone and Android devices, with troubleshooting tips for common issues.",
    author: "MobiaL Team",
    publishedAt: "2026-03-08",
    category: "Guides",
    readTime: "7 min read",
    content: `
      <p>Installing an eSIM is straightforward, but the steps differ slightly between iPhone and Android. This guide walks you through the complete process on both platforms, plus troubleshooting for common issues.</p>

      <h2>Before You Start</h2>
      <p>Make sure you have the following:</p>
      <ul>
        <li>A compatible, carrier-unlocked device</li>
        <li>A stable Wi-Fi connection (you need internet to download the eSIM profile)</li>
        <li>Your eSIM QR code or activation details (provided after purchase)</li>
        <li>Sufficient battery life (at least 30%)</li>
      </ul>
      <p><strong>Important:</strong> Do NOT install the eSIM while connected to your destination's network. Install it while on your home Wi-Fi before traveling, then activate data when you arrive.</p>

      <h2>Installing an eSIM on iPhone</h2>
      <p>These steps apply to iPhone XS, XR, and all later models running iOS 16 or higher.</p>
      <ol>
        <li>Open <strong>Settings</strong> on your iPhone</li>
        <li>Tap <strong>Cellular</strong> (or Mobile Data in some regions)</li>
        <li>Tap <strong>Add eSIM</strong> or <strong>Add Cellular Plan</strong></li>
        <li>Select <strong>Use QR Code</strong></li>
        <li>Point your camera at the QR code provided by MobiaL</li>
        <li>Your iPhone will detect the eSIM profile — tap <strong>Continue</strong></li>
        <li>Wait for the profile to download (10-30 seconds)</li>
        <li>Label the plan (e.g., "Travel Data" or the country name)</li>
        <li>Choose whether to use this as your default line for data</li>
        <li>Tap <strong>Done</strong></li>
      </ol>
      <p>The eSIM will appear under Settings > Cellular alongside your primary SIM. You can toggle it on/off and choose which line handles data, calls, and messages independently.</p>

      <h2>Installing an eSIM on Android</h2>
      <p>Steps vary slightly by manufacturer, but the general process for Samsung, Google Pixel, and other Android devices:</p>
      <ol>
        <li>Open <strong>Settings</strong></li>
        <li>Navigate to <strong>Network & Internet</strong> (or <strong>Connections</strong> on Samsung)</li>
        <li>Tap <strong>SIMs</strong> or <strong>SIM Card Manager</strong></li>
        <li>Tap <strong>Add eSIM</strong> or the <strong>+</strong> button</li>
        <li>Select <strong>Scan QR code</strong></li>
        <li>Scan the QR code from MobiaL</li>
        <li>Confirm the download when prompted</li>
        <li>Wait for the profile to install</li>
        <li>Name the eSIM plan for easy identification</li>
        <li>Set your data preferences</li>
      </ol>
      <p>On Samsung devices, you may also find the eSIM option under Settings > Connections > SIM Manager > Add eSIM.</p>

      <h2>Activating Your eSIM at Your Destination</h2>
      <p>Once you've installed the eSIM profile at home, activation at your destination is simple:</p>
      <ol>
        <li>When you arrive, turn off Airplane Mode</li>
        <li>Go to Settings > Cellular (iPhone) or Settings > Network (Android)</li>
        <li>Enable the travel eSIM for mobile data</li>
        <li>Disable data roaming on your home SIM to avoid charges</li>
        <li>Your phone will connect to a local partner network within 30 seconds</li>
      </ol>
      <p>Some eSIM plans activate automatically upon connection, while others activate on first use. Check your plan details for the specific activation policy.</p>

      <h2>Troubleshooting Common Issues</h2>

      <h3>"Unable to Add Cellular Plan"</h3>
      <p>This usually means your device is carrier-locked. Contact your carrier to request an unlock, which is typically free if your phone is paid off. Alternatively, check that your device model actually supports eSIM — some regional variants don't.</p>

      <h3>QR Code Not Scanning</h3>
      <p>Ensure you're scanning from a screen (not a printout that's too small), in good lighting, and that your camera lens is clean. If the QR code still won't scan, most eSIM providers offer a manual activation code (SM-DP+ address and activation code) that you can enter manually.</p>

      <h3>No Network After Installation</h3>
      <p>Toggle Airplane Mode on and off. Restart your device. Ensure data roaming is enabled for the eSIM line (some travel eSIMs technically roam on partner networks). If the issue persists, check that you're in a coverage area for your specific plan.</p>

      <h3>eSIM Not Appearing in Settings</h3>
      <p>Restart your device. If the eSIM still doesn't appear, check if you've reached your device's eSIM profile limit (most devices support 8-20 profiles, with 2 active simultaneously). You may need to remove an old profile to add a new one.</p>

      <h2>Pro Tips</h2>
      <ul>
        <li>Install your eSIM 1-2 days before departure so you can troubleshoot on home Wi-Fi if needed</li>
        <li>Take a screenshot of your QR code before scanning in case you need it later</li>
        <li>Label your eSIMs clearly (country + dates) if you travel frequently</li>
        <li>Keep your home SIM active for calls/texts while using the eSIM for data only</li>
      </ul>
    `,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getBlogPosts(category?: string): BlogPost[] {
  if (!category || category === "All") return blogPosts
  return blogPosts.filter((post) => post.category === category)
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(currentSlug)
  if (!current) return blogPosts.slice(0, limit)

  return blogPosts
    .filter((post) => post.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.category === current.category ? 1 : 0
      const bMatch = b.category === current.category ? 1 : 0
      return bMatch - aMatch
    })
    .slice(0, limit)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
