import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("public/product-covers");

const covers = [
  {
    slug: "chatgpt-team-workspace-bundle",
    tag: "SMART DEAL",
    category: "CHATGPT",
    display: ["GPT TEAM", "WORKSPACE"],
    accent: ["#ff7a00", "#ffb347", "#ffd45f"],
    motif: "chat",
  },
  {
    slug: "claude-pro-research-pass",
    tag: "VERIFIED",
    category: "CLAUDE",
    display: ["CLAUDE", "PRO"],
    accent: ["#7f5cff", "#d182ff", "#ff9a54"],
    motif: "reason",
  },
  {
    slug: "midjourney-studio-monthly-pass",
    tag: "HOT",
    category: "MIDJOURNEY",
    display: ["MIDJOURNEY", "STUDIO"],
    accent: ["#f24fa0", "#ff8a00", "#ffd36a"],
    motif: "surreal",
  },
  {
    slug: "cursor-max-dev-seat",
    tag: "DEV TOOLS",
    category: "CURSOR",
    display: ["CURSOR", "MAX"],
    accent: ["#00a3ff", "#6be4ff", "#ff8a00"],
    motif: "code",
  },
  {
    slug: "gemini-workspace-pro-credit-pack",
    tag: "TOP SELLER",
    category: "GEMINI",
    display: ["GEMINI", "PRO"],
    accent: ["#00dd80", "#00c5d9", "#3c82ff"],
    motif: "prism",
  },
  {
    slug: "perplexity-research-team-license",
    tag: "DAILY DEAL",
    category: "PERPLEXITY",
    display: ["RESEARCH", "TEAM"],
    accent: ["#00c2ff", "#00f0d7", "#ffe066"],
    motif: "network",
  },
  {
    slug: "copilot-pro-focus-license",
    tag: "FAST DELIVERY",
    category: "COPILOT",
    display: ["COPILOT", "PRO"],
    accent: ["#3b82ff", "#62b1ff", "#4ce1a1"],
    motif: "dashboard",
  },
  {
    slug: "canva-brand-suite-subscription",
    tag: "CREATOR PICK",
    category: "CANVA",
    display: ["BRAND", "SUITE"],
    accent: ["#00d4c8", "#4be1ff", "#8cf6ff"],
    motif: "cards",
  },
  {
    slug: "capcut-pro-editor-pack",
    tag: "TRENDING",
    category: "CAPCUT",
    display: ["CAPCUT", "PRO"],
    accent: ["#ff5a5a", "#ff8a00", "#ffbe55"],
    motif: "timeline",
  },
  {
    slug: "ai-ops-setup-consulting",
    tag: "SERVICE",
    category: "AI OPS",
    display: ["AI OPS", "SETUP"],
    accent: ["#ff9a2f", "#ffc05b", "#ffd978"],
    motif: "ops",
  },
  {
    slug: "custom-manual-offer",
    tag: "PENDING",
    category: "CUSTOM",
    display: ["CUSTOM", "OFFER"],
    accent: ["#ff7a00", "#ffd25f", "#ffeec1"],
    motif: "custom",
  },
];

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function motifShapes(kind, [a, b, c]) {
  switch (kind) {
    case "chat":
      return `
        <g opacity="0.95">
          <rect x="250" y="320" width="430" height="520" rx="42" fill="url(#glassA)" stroke="rgba(255,255,255,.18)" />
          <rect x="370" y="250" width="520" height="650" rx="52" fill="url(#glassB)" stroke="rgba(255,255,255,.24)" />
          <circle cx="885" cy="435" r="120" fill="url(#orbA)" opacity="0.92" />
          <path d="M540 530h250" stroke="#fff" stroke-width="24" stroke-linecap="round" opacity=".82" />
          <path d="M540 610h210" stroke="#fff" stroke-width="24" stroke-linecap="round" opacity=".58" />
          <path d="M540 690h280" stroke="#fff" stroke-width="24" stroke-linecap="round" opacity=".76" />
          <path d="M825 420c72 18 130 80 148 157" stroke="${c}" stroke-width="32" stroke-linecap="round" opacity=".78" />
        </g>`;
    case "reason":
      return `
        <g opacity="0.96">
          <rect x="330" y="250" width="560" height="780" rx="54" fill="url(#glassA)" />
          <rect x="390" y="318" width="440" height="112" rx="26" fill="#ffffff" opacity="0.1" />
          <rect x="390" y="468" width="440" height="112" rx="26" fill="#ffffff" opacity="0.08" />
          <rect x="390" y="618" width="440" height="112" rx="26" fill="#ffffff" opacity="0.08" />
          <rect x="390" y="768" width="360" height="112" rx="26" fill="#ffffff" opacity="0.08" />
          <circle cx="965" cy="482" r="132" fill="url(#orbA)" opacity="0.9" />
          <path d="M290 980c115-150 288-233 518-248" stroke="${b}" stroke-width="26" stroke-linecap="round" opacity=".78" />
        </g>`;
    case "surreal":
      return `
        <g opacity="0.98">
          <circle cx="820" cy="472" r="224" fill="url(#orbA)" opacity="0.94" />
          <path d="M302 920c92-178 212-286 365-320c142-30 248 24 331 181c-105 78-222 136-355 171c-129 35-249 24-341-32z" fill="url(#glassB)" opacity=".86"/>
          <path d="M350 840c112-92 230-141 354-147" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".68" />
          <path d="M438 950c85 27 182 28 291 2" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".54" />
          <rect x="208" y="300" width="212" height="520" rx="106" fill="#fff" opacity=".06" transform="rotate(-18 208 300)" />
        </g>`;
    case "code":
      return `
        <g opacity="0.96">
          <rect x="248" y="270" width="722" height="712" rx="48" fill="url(#glassA)" />
          <rect x="248" y="270" width="722" height="82" rx="48" fill="#fff" opacity="0.08" />
          <circle cx="330" cy="312" r="12" fill="${a}" />
          <circle cx="374" cy="312" r="12" fill="${b}" />
          <circle cx="418" cy="312" r="12" fill="${c}" />
          <path d="M418 570l-98 92l98 92" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" opacity=".9" />
          <path d="M796 570l98 92l-98 92" stroke="${c}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" opacity=".9" />
          <path d="M580 504l-78 314" stroke="${b}" stroke-width="26" stroke-linecap="round" opacity=".92" />
          <path d="M386 438h298" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".3" />
          <path d="M386 470h220" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".18" />
        </g>`;
    case "prism":
      return `
        <g opacity="0.96">
          <path d="M640 210l264 188v380L640 968L376 778V398z" fill="url(#glassA)" />
          <path d="M640 282l196 140v284L640 848L444 706V422z" fill="url(#glassB)" opacity=".82" />
          <path d="M640 210v758" stroke="#fff" stroke-width="12" opacity=".16" />
          <path d="M376 398l264 140l264-140" stroke="#fff" stroke-width="12" opacity=".16" />
          <circle cx="988" cy="438" r="128" fill="url(#orbA)" opacity=".88" />
        </g>`;
    case "network":
      return `
        <g opacity="0.98">
          <path d="M298 806c80-96 180-165 301-208c130-46 252-53 364-20" stroke="#fff" stroke-width="14" opacity=".26" fill="none" />
          <path d="M322 520c78-70 170-118 276-145c143-36 284-24 420 38" stroke="${a}" stroke-width="18" opacity=".46" fill="none" />
          ${[
            [312, 842, a],
            [422, 708, b],
            [566, 616, c],
            [716, 578, a],
            [860, 612, b],
            [948, 734, c],
          ]
            .map(
              ([x, y, fill]) =>
                `<circle cx="${x}" cy="${y}" r="42" fill="${fill}" opacity="0.92" /><circle cx="${x}" cy="${y}" r="18" fill="#fff" opacity="0.92" />`,
            )
            .join("")}
          <circle cx="920" cy="360" r="152" fill="url(#orbA)" opacity=".9" />
        </g>`;
    case "dashboard":
      return `
        <g opacity="0.97">
          <rect x="256" y="300" width="750" height="660" rx="46" fill="url(#glassA)" />
          <rect x="314" y="370" width="332" height="216" rx="30" fill="#ffffff" opacity=".09" />
          <rect x="674" y="370" width="272" height="124" rx="26" fill="#ffffff" opacity=".09" />
          <rect x="674" y="530" width="272" height="248" rx="26" fill="#ffffff" opacity=".07" />
          <path d="M360 698c68-58 128-84 180-78c53 7 102 39 145 96" stroke="${b}" stroke-width="24" stroke-linecap="round" fill="none" />
          <path d="M730 600h150" stroke="${c}" stroke-width="18" stroke-linecap="round" />
          <path d="M730 652h108" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".48" />
          <circle cx="955" cy="328" r="112" fill="url(#orbA)" opacity=".88" />
        </g>`;
    case "cards":
      return `
        <g opacity="0.97">
          <rect x="320" y="250" width="312" height="438" rx="40" fill="url(#glassA)" transform="rotate(-10 320 250)" />
          <rect x="508" y="312" width="332" height="500" rx="44" fill="url(#glassB)" />
          <rect x="404" y="706" width="420" height="264" rx="38" fill="#ffffff" opacity=".08" />
          <circle cx="954" cy="424" r="128" fill="url(#orbA)" opacity=".88" />
          <path d="M564 448h218" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".7" />
          <path d="M564 498h176" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".42" />
          <path d="M460 786h304" stroke="${c}" stroke-width="24" stroke-linecap="round" opacity=".82" />
        </g>`;
    case "timeline":
      return `
        <g opacity="0.97">
          <rect x="268" y="338" width="724" height="588" rx="52" fill="url(#glassA)" />
          <rect x="268" y="838" width="724" height="88" rx="44" fill="#ffffff" opacity=".08" />
          <path d="M418 536l252 152l-252 152z" fill="#fff" opacity=".86" />
          <path d="M730 470h168" stroke="${b}" stroke-width="20" stroke-linecap="round" opacity=".82" />
          <path d="M730 534h210" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".54" />
          <path d="M730 598h146" stroke="${c}" stroke-width="20" stroke-linecap="round" opacity=".82" />
          ${[340, 470, 600, 730, 860]
            .map((x) => `<rect x="${x}" y="860" width="58" height="42" rx="18" fill="#fff" opacity=".14" />`)
            .join("")}
          <circle cx="948" cy="334" r="116" fill="url(#orbA)" opacity=".88" />
        </g>`;
    case "ops":
    case "custom":
      return `
        <g opacity="0.97">
          <path d="M300 868h188v-160h222v160h250" stroke="url(#panelLine)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <circle cx="300" cy="868" r="54" fill="${a}" />
          <circle cx="488" cy="708" r="54" fill="${b}" />
          <circle cx="710" cy="708" r="54" fill="${c}" />
          <circle cx="960" cy="868" r="54" fill="${a}" />
          <rect x="414" y="312" width="424" height="224" rx="34" fill="url(#glassA)" />
          <path d="M474 400h280" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".76" />
          <path d="M474 456h188" stroke="#fff" stroke-width="20" stroke-linecap="round" opacity=".36" />
          <circle cx="952" cy="362" r="112" fill="url(#orbA)" opacity=".88" />
        </g>`;
    default:
      return "";
  }
}

function baseDefs([a, b, c], id) {
  return `
    <defs>
      <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f141b" />
        <stop offset="56%" stop-color="#141c25" />
        <stop offset="100%" stop-color="#0d1218" />
      </linearGradient>
      <linearGradient id="accent${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${a}" />
        <stop offset="55%" stop-color="${b}" />
        <stop offset="100%" stop-color="${c}" />
      </linearGradient>
      <linearGradient id="glassA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,.14)" />
        <stop offset="100%" stop-color="rgba(255,255,255,.04)" />
      </linearGradient>
      <linearGradient id="glassB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,.1)" />
        <stop offset="100%" stop-color="rgba(255,255,255,.02)" />
      </linearGradient>
      <radialGradient id="orbA" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="${b}" stop-opacity=".95" />
        <stop offset="100%" stop-color="${a}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="panelLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${a}" />
        <stop offset="50%" stop-color="${b}" />
        <stop offset="100%" stop-color="${c}" />
      </linearGradient>
      <pattern id="grid${id}" width="84" height="84" patternUnits="userSpaceOnUse">
        <path d="M84 0H0V84" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
      </pattern>
      <filter id="noise${id}" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0 .07 .1"/>
        </feComponentTransfer>
      </filter>
      <filter id="blur${id}">
        <feGaussianBlur stdDeviation="70"/>
      </filter>
    </defs>`;
}

function renderPoster(cover, index) {
  const [line1, line2] = cover.display.map(esc);
  const category = esc(cover.category);
  const tag = esc(cover.tag);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1260 1600" role="img" aria-label="${esc(
    `${cover.display.join(" ")} product cover`,
  )}">
  ${baseDefs(cover.accent, `poster${index}`)}
  <rect width="1260" height="1600" fill="url(#bgposter${index})"/>
  <rect width="1260" height="1600" fill="url(#gridposter${index})" opacity=".6"/>
  <ellipse cx="972" cy="330" rx="320" ry="240" fill="${cover.accent[0]}" opacity=".16" filter="url(#blurposter${index})"/>
  <ellipse cx="300" cy="1180" rx="360" ry="240" fill="${cover.accent[1]}" opacity=".12" filter="url(#blurposter${index})"/>
  <g>${motifShapes(cover.motif, cover.accent)}</g>
  <rect x="64" y="64" width="320" height="54" rx="27" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.14)"/>
  <text x="102" y="99" fill="#ffffff" font-size="22" font-family="Roboto, Arial, sans-serif" font-weight="700" letter-spacing="4">${category}</text>
  <rect x="920" y="64" width="276" height="54" rx="27" fill="${cover.accent[0]}"/>
  <text x="1058" y="99" fill="#ffffff" text-anchor="middle" font-size="22" font-family="Roboto, Arial, sans-serif" font-weight="800" letter-spacing="3">${tag}</text>
  <g transform="translate(78 1188)">
    <rect width="1104" height="334" rx="44" fill="rgba(9,12,16,.78)" stroke="rgba(255,255,255,.12)"/>
    <rect x="36" y="36" width="220" height="10" rx="5" fill="url(#accentposter${index})"/>
    <text x="40" y="138" fill="#ffffff" font-size="106" font-family="Roboto, Arial, sans-serif" font-weight="900" letter-spacing="-2">${line1}</text>
    <text x="40" y="246" fill="#ffffff" font-size="106" font-family="Roboto, Arial, sans-serif" font-weight="900" letter-spacing="-2">${line2}</text>
    <text x="40" y="302" fill="rgba(255,255,255,.72)" font-size="28" font-family="Roboto, Arial, sans-serif" font-weight="500">Verified AI marketplace offer with instant delivery styling.</text>
  </g>
  <rect width="1260" height="1600" filter="url(#noiseposter${index})" opacity=".18"/>
</svg>`;
}

function renderHero(cover, index) {
  const category = esc(cover.category);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 820" role="img" aria-label="${esc(
    `${cover.display.join(" ")} hero art`,
  )}">
  ${baseDefs(cover.accent, `hero${index}`)}
  <rect width="1800" height="820" fill="url(#bghero${index})"/>
  <rect width="1800" height="820" fill="url(#gridhero${index})" opacity=".36"/>
  <rect width="1800" height="820" fill="url(#fade${index})"/>
  <defs>
    <linearGradient id="fade${index}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(9,12,16,.92)"/>
      <stop offset="42%" stop-color="rgba(9,12,16,.68)"/>
      <stop offset="80%" stop-color="rgba(9,12,16,.12)"/>
      <stop offset="100%" stop-color="rgba(9,12,16,0)"/>
    </linearGradient>
  </defs>
  <ellipse cx="1390" cy="240" rx="350" ry="230" fill="${cover.accent[0]}" opacity=".18" filter="url(#blurhero${index})"/>
  <ellipse cx="1250" cy="660" rx="360" ry="220" fill="${cover.accent[1]}" opacity=".14" filter="url(#blurhero${index})"/>
  <g transform="translate(700 -120) scale(.64)">
    ${motifShapes(cover.motif, cover.accent)}
  </g>
  <rect x="1210" y="126" width="360" height="500" rx="34" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.16)"/>
  <rect x="1240" y="156" width="300" height="14" rx="7" fill="url(#accenthero${index})"/>
  <text x="1240" y="240" fill="#ffffff" font-size="56" font-family="Roboto, Arial, sans-serif" font-weight="900">${esc(
    cover.display[0],
  )}</text>
  <text x="1240" y="300" fill="#ffffff" font-size="56" font-family="Roboto, Arial, sans-serif" font-weight="900">${esc(
    cover.display[1],
  )}</text>
  <text x="1240" y="352" fill="rgba(255,255,255,.72)" font-size="22" font-family="Roboto, Arial, sans-serif" font-weight="600">${category} marketplace art</text>
  <g transform="translate(1240 404)">
    <rect width="272" height="54" rx="18" fill="rgba(255,255,255,.08)"/>
    <rect y="84" width="214" height="54" rx="18" fill="rgba(255,255,255,.08)"/>
    <rect y="168" width="248" height="54" rx="18" fill="rgba(255,255,255,.08)"/>
  </g>
  <rect width="1800" height="820" filter="url(#noisehero${index})" opacity=".14"/>
</svg>`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    covers.flatMap((cover, index) => [
      writeFile(path.join(outputDir, `${cover.slug}-poster.svg`), renderPoster(cover, index + 1)),
      writeFile(path.join(outputDir, `${cover.slug}-hero.svg`), renderHero(cover, index + 1)),
    ]),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
