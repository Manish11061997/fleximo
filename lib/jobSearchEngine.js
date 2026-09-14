// ═══════════════════════════════════════════════════════════════════════════════
// JOB SEARCH ENGINE — Aggregates from 4 free remote job APIs
// ═══════════════════════════════════════════════════════════════════════════════

// ─── India Location Detection ────────────────────────────────────────────────

// ─── India Location Detection ────────────────────────────────────────────────

const INDIA_INDICATORS = {
  cities: [
    'bangalore', 'bengaluru', 'mumbai', 'bombay', 'delhi', 'new delhi',
    'ncr', 'gurgaon', 'gurugram', 'noida', 'greater noida', 'ghaziabad',
    'faridabad', 'hyderabad', 'secunderabad', 'chennai', 'madras',
    'pune', 'kolkata', 'calcutta', 'ahmedabad', 'jaipur', 'lucknow',
    'chandigarh', 'mohali', 'panchkula', 'indore', 'bhopal',
    'kochi', 'cochin', 'ernakulam', 'thiruvananthapuram', 'trivandrum',
    'coimbatore', 'nagpur', 'patna', 'visakhapatnam', 'vizag',
    'mangalore', 'mangaluru', 'mysore', 'mysuru', 'surat', 'vadodara',
    'baroda', 'rajkot', 'bhubaneswar', 'ranchi', 'dehradun', 'shimla',
    'guwahati', 'agra', 'varanasi', 'kanpur', 'allahabad', 'prayagraj',
    'tiruchirappalli', 'trichy', 'madurai', 'salem', 'hubli', 'dharwad',
    'belgaum', 'belagavi', 'pondicherry', 'puducherry', 'gangtok',
    'shillong', 'imphal', 'aizawl', 'kohima', 'itanagar', 'agartala',
    'panaji', 'goa', 'jammu', 'srinagar', 'leh', 'ladakh', 'nellore',
    'guntur', 'tirupati', 'kurnool', 'kakinada', 'rajahmundry', 'warangal',
    'nizamabad', 'solapur', 'kolhapur', 'aurangabad', 'nashik', 'bhavnagar',
    'jamnagar', 'gandhinagar', 'jodhpur', 'udaipur', 'kota', 'bikaner',
    'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'jamshedpur', 'dhanbad',
    'cuttack', 'rourkela', 'dadra', 'nagar haveli', 'daman', 'diu'
  ],
  states: [
    'karnataka', 'maharashtra', 'telangana', 'tamil nadu', 'kerala',
    'andhra pradesh', 'west bengal', 'gujarat', 'rajasthan', 'uttar pradesh',
    'madhya pradesh', 'bihar', 'odisha', 'punjab', 'haryana', 'jharkhand',
    'uttarakhand', 'chhattisgarh', 'assam', 'himachal pradesh',
    'goa', 'meghalaya', 'tripura', 'manipur', 'mizoram', 'nagaland',
    'arunachal pradesh', 'sikkim', 'dadra and nagar haveli', 'daman and diu',
    'puducherry', 'jammu and kashmir', 'ladakh'
  ],
  keywords: [
    'india', 'indian', 'bharat',
    'ist', 'asia/kolkata', 'asia/calcutta',
    'indian standard time', 'india standard time',
    'inr', '₹'
  ]
};

// Pre-compile patterns for India detection
const INDIA_CITY_PATTERN = new RegExp(
  `\\b(?:${INDIA_INDICATORS.cities.filter(c => c && c.trim().length > 1).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i'
);
const INDIA_STATE_PATTERN = new RegExp(
  `\\b(?:${INDIA_INDICATORS.states.filter(s => s && s.trim().length > 1).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i'
);
const INDIA_KEYWORD_PATTERN = new RegExp(
  `\\b(?:india|indian|bharat|ist|asia/kolkata|asia/calcutta|indian standard time|india standard time|inr)\\b`, 'i'
);

/**
 * Safely sanitize location string
 */
function sanitizeLocation(loc) {
  if (!loc || typeof loc !== 'string') return 'Worldwide';
  let cleaned = loc
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim();

  if (!cleaned || cleaned.length < 2) return 'Worldwide';
  return cleaned;
}

/**
 * Safely convert tags to an array (some APIs return objects or strings)
 */
function safeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (tags && typeof tags === 'object') return Object.values(tags);
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim());
  return [];
}

/**
 * Check if job is in Australia or NZ
 */
function isAustraliaNZ(job) {
  if (!job || typeof job !== 'object') return false;
  const locLower = (job.location || '').toLowerCase();
  const descLower = (job.description || '').substring(0, 1000).toLowerCase();
  const textToCheck = `${locLower} ${descLower}`;
  return /\b(australia|australian|new zealand|nz|auckland|sydney|melbourne|brisbane|perth|adelaide|canberra|wellington|christchurch|aest|nzst)\b/i.test(locLower) ||
         /\b(australia only|nz only|apac|asia pacific)\b/i.test(textToCheck);
}

/**
 * Classify a job's regional eligibility with strict country/timezone detection
 */
function classifyJobRegion(job) {
  if (!job || typeof job !== 'object') {
    return {
      isWorldwide: true,
      indiaEligible: false,
      remoteType: 'worldwide',
      remoteTypeLabel: '100% Worldwide Remote',
      badge: '🌐 Worldwide',
      badgeClass: 'badge-worldwide',
      countryScope: 'worldwide',
      countryLabel: 'Worldwide'
    };
  }
  const locClean = sanitizeLocation(job.location);
  const locLower = locClean.toLowerCase();
  const headerText = `${locClean} ${job.title || ''} ${safeTags(job.tags).join(' ')}`.toLowerCase();
  const fullText = `${headerText} ${(job.description || '').substring(0, 500)}`.toLowerCase();

  // 1. Explicit country / geographic restriction gates (Checked FIRST)
  const isRestrictedUS = (
    /\b(us only|usa only|united states only|north america only|us candidates?|us timezone|us residents?|us work authorization|us citizen|us\/canada|usa remote)\b/i.test(headerText) ||
    /\b(in the us|in usa|based in us|located in us|us only)\b/i.test(locLower) ||
    locLower === 'usa' || locLower === 'united states' || locLower === 'us'
  );

  const isRestrictedEU = (
    /\b(eu only|europe only|emea only|uk only|germany only|france only|uk candidates?|uk\/eu)\b/i.test(headerText) ||
    /\b(in europe|in uk|based in eu|located in europe|eu only)\b/i.test(locLower) ||
    locLower === 'uk' || locLower === 'germany' || locLower === 'france' || locLower === 'poland' || locLower === 'netherlands' || locLower === 'spain'
  );

  const isRestrictedLATAM = (
    /\b(latam only|latin america only|brazil only|argentina only)\b/i.test(headerText) ||
    /\b(in latam|in latin america|latam only)\b/i.test(locLower) ||
    locLower === 'latam' || locLower === 'brazil' || locLower === 'argentina' || locLower === 'chile' || locLower === 'mexico'
  );

  const isAustraliaNZ = (
    /\b(australia only|nz only|apac only|australia\/new zealand|aest|nzst)\b/i.test(headerText) ||
    locLower === 'australia' || locLower === 'new zealand' || locLower === 'apac'
  );

  // 2. India Location Check
  const isIndiaSpecific = (
    INDIA_CITY_PATTERN.test(headerText) ||
    INDIA_STATE_PATTERN.test(headerText) ||
    INDIA_KEYWORD_PATTERN.test(headerText) ||
    (INDIA_KEYWORD_PATTERN.test(fullText) && !locLower.includes('usa') && !locLower.includes('europe'))
  );

  // 3. True 100% Worldwide Check
  const isWorldwide = (
    locLower === 'worldwide' ||
    locLower === 'anywhere' ||
    locLower === 'anywhere in the world' ||
    locLower === 'work from anywhere' ||
    locLower === 'everywhere' ||
    locLower === 'global' ||
    locLower === 'remote' ||
    (locLower.includes('americas') && locLower.includes('europe') && locLower.includes('asia')) ||
    (locLower.includes('worldwide') && !locLower.includes('only'))
  ) && !isRestrictedUS && !isRestrictedEU && !isRestrictedLATAM && !isAustraliaNZ;

  // Return structured classification with orthogonal Remote Type & Country Scope
  if (isRestrictedUS) {
    return {
      region: 'us_restricted',
      remoteType: 'country_restricted',
      remoteTypeLabel: '📍 Country-Specific Remote',
      countryScope: 'us',
      countryLabel: 'United States & Americas',
      indiaEligible: false,
      isWorldwide: false,
      badge: '🇺🇸 US / Americas Only (Restricted)',
      badgeClass: 'badge-restricted'
    };
  }

  if (isRestrictedEU) {
    return {
      region: 'eu_restricted',
      remoteType: 'country_restricted',
      remoteTypeLabel: '📍 Country-Specific Remote',
      countryScope: 'europe',
      countryLabel: 'Europe & UK',
      indiaEligible: false,
      isWorldwide: false,
      badge: '🇪🇺 Europe / UK Only (Restricted)',
      badgeClass: 'badge-restricted'
    };
  }

  if (isRestrictedLATAM) {
    return {
      region: 'latam_restricted',
      remoteType: 'country_restricted',
      remoteTypeLabel: '📍 Country-Specific Remote',
      countryScope: 'latam',
      countryLabel: 'Latin America (LATAM)',
      indiaEligible: false,
      isWorldwide: false,
      badge: '🌎 LATAM Only (Restricted)',
      badgeClass: 'badge-restricted'
    };
  }

  if (isAustraliaNZ) {
    return {
      region: 'au_nz',
      remoteType: 'country_restricted',
      remoteTypeLabel: '📍 Country-Specific Remote',
      countryScope: 'apac',
      countryLabel: 'Australia & APAC',
      indiaEligible: false,
      isWorldwide: false,
      badge: '🇦🇺 Australia / APAC Remote',
      badgeClass: 'badge-aunz'
    };
  }

  if (isIndiaSpecific) {
    return {
      region: 'india',
      remoteType: 'country_restricted',
      remoteTypeLabel: '📍 Country-Specific Remote',
      countryScope: 'india',
      countryLabel: 'India',
      indiaEligible: true,
      isWorldwide: false,
      badge: '🇮🇳 India Remote',
      badgeClass: 'badge-india'
    };
  }

  if (isWorldwide) {
    return {
      region: 'worldwide',
      remoteType: 'worldwide',
      remoteTypeLabel: '🌐 100% Work from Anywhere',
      countryScope: 'worldwide',
      countryLabel: 'Worldwide (Any Country)',
      indiaEligible: true,
      isWorldwide: true,
      badge: '🌐 Work from Anywhere (Worldwide)',
      badgeClass: 'badge-worldwide'
    };
  }

  return {
    region: 'global',
    remoteType: 'country_restricted',
    remoteTypeLabel: '📍 Regional Remote',
    countryScope: 'other',
    countryLabel: locClean,
    indiaEligible: false,
    isWorldwide: false,
    badge: `📍 ${locClean}`,
    badgeClass: 'badge-global'
  };
}

// ─── Match Scoring ────────────────────────────────────────────────────────────

/**
 * Detect primary technical domain from resume skills & titles.
 * Returns synonymous terms that MUST appear in job title/tags for specialized platforms.
 * For generic tech stacks (React, Python, Java, Node.js etc.) returns [] = no gate.
 */
function detectPrimaryDomain(skills, titles) {
  const allLower = [...skills, ...titles].map(s => s.toLowerCase());

  const domains = [
    {
      terms: ['salesforce','apex','lwc','visualforce','soql','sosl','force.com','sales cloud','service cloud'],
      synonyms: ['salesforce','apex','lwc','visualforce','soql','sales cloud','service cloud','force.com']
    },
    {
      terms: ['sap','abap','hana','s/4hana','fiori'],
      synonyms: ['sap','abap','hana','fiori','erp']
    },
    {
      terms: ['oracle erp','oracle hcm','jde','peoplesoft','oracle fusion'],
      synonyms: ['oracle erp','oracle hcm','jde','peoplesoft','fusion']
    },
    {
      terms: ['flutter','dart'],
      synonyms: ['flutter','dart','mobile','mobile development','app developer']
    },
    {
      terms: ['android','kotlin','jetpack compose'],
      synonyms: ['android','kotlin','jetpack','mobile','mobile development','app developer']
    },
    {
      terms: ['ios','swift','swiftui'],
      synonyms: ['ios','swift','swiftui','objective-c','mobile','mobile development','app developer']
    },
    {
      terms: ['react native'],
      synonyms: ['react native','mobile','mobile development','app developer']
    },
    {
      terms: ['blockchain','solidity','web3','ethereum','defi'],
      synonyms: ['blockchain','solidity','web3','ethereum','defi','smart contract']
    },
  ];

  const matchedSynonyms = [];
  for (const domain of domains) {
    const hasMatch = domain.terms.some(t => allLower.some(r => r.includes(t)));
    if (hasMatch) {
      matchedSynonyms.push(...domain.synonyms);
    }
  }

  return Array.from(new Set(matchedSynonyms));
}

// ─── Canonical Skill Formatter ──────────────────────────────────────────────
const CANONICAL_SKILL_MAP = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'node': 'Node.js',
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'python': 'Python',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'java': 'Java',
  'spring': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'c++': 'C++',
  'c#': 'C#',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'php': 'PHP',
  'laravel': 'Laravel',
  'ruby': 'Ruby',
  'rails': 'Ruby on Rails',
  'ruby on rails': 'Ruby on Rails',
  'sql': 'SQL',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'aws': 'AWS',
  'gcp': 'GCP',
  'azure': 'Azure',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'graphql': 'GraphQL',
  'rest': 'REST API',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'git': 'Git',
  'ci/cd': 'CI/CD',
  'salesforce': 'Salesforce',
  'apex': 'Apex',
  'lwc': 'LWC',
  'visualforce': 'Visualforce',
  'soql': 'SOQL',
  'solidity': 'Solidity',
  'flutter': 'Flutter',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'android': 'Android',
  'ios': 'iOS'
};

function formatCanonicalSkill(skill) {
  if (!skill) return '';
  const lower = String(skill).toLowerCase().trim();
  if (CANONICAL_SKILL_MAP[lower]) return CANONICAL_SKILL_MAP[lower];
  return lower.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatSalary(salaryRaw) {
  if (!salaryRaw || typeof salaryRaw !== 'string') return null;
  let str = salaryRaw.trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return null;

  const rangeMatch = str.match(/(?:USD|\$|EUR|GBP)?\s*(\d{4,7})\s*(?:-|to)\s*(?:USD|\$|EUR|GBP)?\s*(\d{4,7})/i);
  if (rangeMatch) {
    const minK = Math.round(parseInt(rangeMatch[1], 10) / 1000);
    const maxK = Math.round(parseInt(rangeMatch[2], 10) / 1000);
    if (minK > 0 && maxK > 0) {
      return `$${minK}k - $${maxK}k`;
    }
  }

  const singleMatch = str.match(/(?:USD|\$)\s*(\d{4,7})/i);
  if (singleMatch) {
    const k = Math.round(parseInt(singleMatch[1], 10) / 1000);
    if (k > 0) return `$${k}k`;
  }

  return str;
}

const GENERIC_SKILLS = new Set([
  'git', 'github', 'gitlab', 'agile', 'scrum', 'jira', 'confluence',
  'rest', 'rest api', 'restful', 'json', 'html', 'html5', 'css', 'css3',
  'bash', 'linux', 'ci/cd', 'unit testing', 'testing', 'debugging',
  'api', 'apis', 'microservices', 'clean code', 'problem solving'
]);



// Non-Technical / Non-Dev Titles to strictly reject for technical queries
const NON_TECH_TITLE_PATTERNS = [
  /\b(bartender|barista|chef|cook|driver|waiter|waitress|cashier|retail|warehouse|delivery|cleaner|janitor)\b/i,
  /\b(nurse|care navigator|caregiver|physician|therapist|medical assistant|dental|healthcare assistant|phlebotomist|pharmacist)\b/i,
  /\b(don't see an open position|general application|future opportunity|talent community|talent pool|expression of interest|spontaneous application)\b/i,
  /\b(human resources|hr generalist|hr specialist|hr coordinator|hr manager|recruiter|talent acquisition|people operations|administrative assistant|virtual assistant|executive assistant|office manager|receptionist|clerk|bookkeeper)\b/i,
  /\b(tutor|teacher|instructor|faculty|adjunct|professor)\b/i,
  /\b(copywriter|content writer|content creator|technical writer|writer|marketing manager|seo specialist|social media|growth marketing|demand gen|campaign manager)\b/i,
  /\b(sales consultant|account executive|sales representative|business development|telemarketing|sales executive|sales manager|sales success|lead generation|deal desk|sales engineer|enterprise sales engineer)\b/i,
  /\b(customer engineer|senior customer engineer|customer solution|solutions engineer|customer solution architect|customer experience|customer success)\b/i,
  /\b(customer service|customer support|support engineer|help desk|technical support specialist|it support|client support)\b/i,
  /\b(accounts receivable|accounts payable|accountant|financial analyst|billing specialist|collections specialist|payroll)\b/i,
  /\b(legal counsel|compliance officer|contracts specialist|paralegal|edi consultant|site engineer)\b/i,
  /\b(designer|graphic designer|ui\/ux|ui designer|ux designer|product designer|visual designer|motion designer|brand designer|illustrator|animator|3d artist|video editor)\b/i
];

// High-performance regex cache for O(1) skill & keyword pattern matching
const regexCache = new Map();
function getBoundaryRegex(term) {
  let reg = regexCache.get(term);
  if (!reg) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    reg = new RegExp(`(?:^|[\\s,;()\\[\\]{}|/\\xB7\\u2022\\-])${escaped}(?:$|[\\s,;()\\[\\]{}|/\\xB7\\u2022\\-\\.]|$)`, 'i');
    if (regexCache.size < 3000) {
      regexCache.set(term, reg);
    }
  }
  return reg;
}

/**
 * Calculate match score (0-100) between a resume and a job posting.
 * Generic — works for ANY technology stack with strict false-positive prevention.
 */
function calculateMatchScore(job, resumeSkills, resumeTitles, resumeExperience, resumeKeywords) {
  const rawResumeSkills   = (resumeSkills   || []).map(s => String(s).toLowerCase().trim()).filter(s => s.length >= 2);
  const rawResumeTitles   = (resumeTitles   || []).map(t => String(t).toLowerCase().trim()).filter(t => t.length >= 2);
  const rawResumeKeywords = (resumeKeywords || []).map(k => String(k).toLowerCase().trim()).filter(k => k.length >= 2);

  // Expand multi-word keywords into full phrases + individual words (e.g. 'java spring boot' -> ['java spring boot', 'java', 'spring', 'boot'])
  const allResumeKeywords = [];
  const seenKws = new Set();
  for (const kw of rawResumeKeywords) {
    if (!seenKws.has(kw)) {
      seenKws.add(kw);
      allResumeKeywords.push(kw);
    }
    const words = kw.split(/\s+/).filter(w => w.length >= 3 && !/^(the|and|for|with|senior|junior|lead|staff|principal|developer|engineer|specialist|manager)$/i.test(w));
    for (const word of words) {
      if (!seenKws.has(word)) {
        seenKws.add(word);
        allResumeKeywords.push(word);
      }
    }
  }

  const allResumeSkills = Array.from(new Set(rawResumeSkills));
  const allResumeTitles = Array.from(new Set(rawResumeTitles));

  if (allResumeSkills.length === 0 && allResumeKeywords.length === 0 && allResumeTitles.length === 0) {
    return { score: 0, matchedSkills: [], matchedKeywords: [] };
  }

  const jobTitleLower  = (job.title || '').toLowerCase();
  const jobTagsLower   = safeTags(job.tags).map(t => String(t).toLowerCase()).join(' ');
  const jobDescLower   = (job.description || '').substring(0, 5000).toLowerCase();

  // ── 0. Strict Non-Technical Role Exclusion ──────────────────────────────
  const hasExplicitKeywordInTitle = allResumeKeywords.some(k => k && k.length >= 3 && jobTitleLower.includes(k.toLowerCase()));
  const hasExplicitTitleInTitle   = allResumeTitles.some(t => t && t.length >= 3 && jobTitleLower.includes(t.toLowerCase()));

  // If candidate is looking for tech roles, strictly disqualify non-tech titles
  const isTechCandidate = (
    allResumeSkills.length >= 1 ||
    allResumeTitles.some(t => /developer|engineer|programmer|architect|fullstack|frontend|backend|devops|data|software|coder/i.test(t)) ||
    allResumeKeywords.some(k => /developer|engineer|flutter|react|python|java|golang|rust|ruby|rails|devops|node|sql|solidity|salesforce|aws/i.test(k))
  );

  if (!hasExplicitKeywordInTitle && !hasExplicitTitleInTitle && isTechCandidate) {
    for (const pattern of NON_TECH_TITLE_PATTERNS) {
      if (pattern.test(jobTitleLower)) {
        return { score: 0, matchedSkills: [], matchedKeywords: [] };
      }
    }
  }

  // ── 1. Title Match Score ─────────────────────────────────────────────────
  let titleScore = 0;
  for (const resumeTitle of allResumeTitles) {
    if (!resumeTitle) continue;
    if (jobTitleLower.includes(resumeTitle)) { titleScore = 100; break; }
    const stopWords = /^(the|and|for|with|developer|engineer|specialist|manager|lead|senior|junior|associate|principal|staff)$/i;
    const titleWords = resumeTitle.split(/\s+/).filter(w => w.length > 3 && !stopWords.test(w));
    if (titleWords.length > 0) {
      const matchCount = titleWords.filter(w => jobTitleLower.includes(w)).length;
      const partial = (matchCount / titleWords.length) * 80;
      if (partial > titleScore) titleScore = partial;
    }
  }

  // ── 2. Skill Matching ────────────────────────────────────────────────────
  const titleMatchedSkills = [];
  const tagMatchedSkills   = [];
  const descMatchedSkills  = [];

  for (const skill of allResumeSkills) {
    if (!skill || skill.length < 2) continue;
    const pattern = getBoundaryRegex(skill);
    if (pattern.test(jobTitleLower))      titleMatchedSkills.push(skill);
    else if (pattern.test(jobTagsLower))  tagMatchedSkills.push(skill);
    else if (pattern.test(jobDescLower))  descMatchedSkills.push(skill);
  }
  const matchedSkills = Array.from(new Set([...titleMatchedSkills, ...tagMatchedSkills, ...descMatchedSkills]));

  // Core vs Generic Skill Breakdown
  const coreTitleSkills = titleMatchedSkills.filter(s => !GENERIC_SKILLS.has(s.toLowerCase()));
  const coreTagSkills   = tagMatchedSkills.filter(s => !GENERIC_SKILLS.has(s.toLowerCase()));
  const coreDescSkills  = descMatchedSkills.filter(s => !GENERIC_SKILLS.has(s.toLowerCase()));
  const coreMatchedSkills = Array.from(new Set([...coreTitleSkills, ...coreTagSkills, ...coreDescSkills]));

  // ── 3. Keyword Matching ──────────────────────────────────────────────────
  const matchedKeywords = [];
  let hasKeywordInTitle = false;
  let hasKeywordInTags  = false;
  let hasKeywordInDesc  = false;

  for (const keyword of allResumeKeywords) {
    if (!keyword || keyword.length < 2) continue;
    const pattern = getBoundaryRegex(keyword);
    const inTitle = pattern.test(jobTitleLower);
    const inTags  = pattern.test(jobTagsLower);
    const inDesc  = pattern.test(jobDescLower);

    if (inTitle) hasKeywordInTitle = true;
    if (inTags)  hasKeywordInTags  = true;
    if (inDesc)  hasKeywordInDesc  = true;

    if (inTitle || inTags || inDesc) matchedKeywords.push(keyword);
  }

  // ── 4. Strict Keyword Search Enforcement ────────────────────────────────
  if (allResumeKeywords.length > 0) {
    const hasAnySkillMatch = matchedSkills.length > 0 || titleScore >= 25;
    if (!hasKeywordInTitle && !hasKeywordInTags && !hasKeywordInDesc && !hasAnySkillMatch) {
      return { score: 0, matchedSkills: [], matchedKeywords: [] };
    }
  }

  // ── 5. Minimum Relevance Gate ────────────────────────────────────────────
  const isDevTitle = /\b(developer|engineer|programmer|architect|data|devops|software|fullstack|frontend|backend|cloud|tech|consultant|specialist|lead|analyst|manager|qa|sdet|admin)\b/i.test(jobTitleLower);
  const isValidMatch = (
    hasKeywordInTitle ||
    hasExplicitKeywordInTitle ||
    titleScore >= 30 ||
    coreTitleSkills.length >= 1 ||
    (isDevTitle && (hasKeywordInTags || hasKeywordInDesc || coreDescSkills.length >= 1)) ||
    (coreTagSkills.length >= 1 && (hasKeywordInDesc || coreDescSkills.length >= 1))
  );

  if (!isValidMatch) return { score: 0, matchedSkills: [], matchedKeywords: [] };

  // ── 6. Score Calculation ─────────────────────────────────────────────────
  let score = 30; // Baseline for verified relevant match

  // Direct Title Match Contribution (up to 40 points)
  if (hasKeywordInTitle || titleScore >= 80) {
    score += 40;
  } else if (titleScore >= 50) {
    score += 25;
  } else if (titleScore >= 25) {
    score += 15;
  }

  // Keyword in Description / Tags
  if (hasKeywordInTags) {
    score += 20;
  }
  if (hasKeywordInDesc) {
    score += 15;
  }

  // Core title/tag skills — up to 25 points
  if (coreTitleSkills.length > 0 || coreTagSkills.length > 0) {
    score += Math.min(25, 15 + (coreTitleSkills.length + coreTagSkills.length - 1) * 5);
  }

  // Core description skills — up to 15 points
  if (coreDescSkills.length > 0) {
    score += Math.min(15, 8 + (coreDescSkills.length - 1) * 3);
  }

  // Custom keywords contribution — up to 15 points
  if (matchedKeywords.length > 0) {
    score += Math.min(15, 8 + (matchedKeywords.length - 1) * 3);
  }

  // High-Confidence Bonuses
  if (hasKeywordInTitle || (titleScore >= 80 && coreMatchedSkills.length >= 1)) {
    score = Math.max(score, 95);
  } else if (isDevTitle && (hasKeywordInTags || coreTagSkills.length >= 1) && hasKeywordInDesc) {
    score = Math.max(score, 88);
  }

  return {
    score: Math.min(99, Math.max(35, Math.round(score))),
    matchedSkills:   matchedSkills.map(formatCanonicalSkill),
    matchedKeywords: matchedKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1))
  };
}

// ─── Date Filtering ──────────────────────────────────────────────────────────

function isWithinDays(dateInput, days) {
  if (!dateInput) return false;

  let date;
  if (typeof dateInput === 'number') {
    date = dateInput > 1e12 ? new Date(dateInput) : new Date(dateInput * 1000);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);

  return daysDiff >= 0 && daysDiff <= days;
}

function daysAgo(dateInput) {
  if (!dateInput) return null;

  let date;
  if (typeof dateInput === 'number') {
    date = dateInput > 1e12 ? new Date(dateInput) : new Date(dateInput * 1000);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── HTML Tag Stripper ───────────────────────────────────────────────────────

function stripHtml(html) {
  if (!html) return '';
  let text = String(html);

  // Remove CDATA wrappers
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // Decode common HTML entities first so tags become cleanly parseable
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8217;/gi, "'")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#8211;/gi, '-')
    .replace(/&#8212;/gi, '—');

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Ensures job URL is absolute with valid protocol
 */
function normalizeUrl(urlStr, defaultHost = 'https://google.com') {
  if (!urlStr || typeof urlStr !== 'string') return defaultHost;
  let trimmed = urlStr.trim();
  if (!trimmed) return defaultHost;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }
  if (trimmed.startsWith('/')) {
    return defaultHost.replace(/\/$/, '') + trimmed;
  }
  return 'https://' + trimmed;
}

// ─── API Fetchers ────────────────────────────────────────────────────────────

const FETCH_TIMEOUT = 8000; // 8 seconds maximum

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers
      }
    });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Fetch jobs from Remotive API
 */
async function fetchRemotiveJobs(query = '') {
  try {
    const url = query
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=100`
      : 'https://remotive.com/api/remote-jobs?limit=100';

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    return (data.jobs || []).map(job => ({
      id: `remotive-${job.id}`,
      title: job.title || '',
      company: job.company_name || '',
      companyLogo: job.company_logo || null,
      location: job.candidate_required_location || 'Worldwide',
      description: stripHtml(job.description || ''),
      descriptionHtml: job.description || '',
      url: normalizeUrl(job.url, 'https://remotive.com'),
      tags: job.tags || [],
      salary: job.salary || null,
      category: job.category || '',
      jobType: job.job_type || '',
      postedDate: job.publication_date,
      daysAgo: daysAgo(job.publication_date),
      source: 'Remotive'
    }));
  } catch (err) {
    console.error('Remotive API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from RemoteOK API with multi-tag and search query support
 */
async function fetchRemoteOKJobs(query = '') {
  try {
    const urls = ['https://remoteok.com/api'];
    if (query) {
      const qClean = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (qClean) {
        urls.push(`https://remoteok.com/api?tag=${encodeURIComponent(qClean)}`);
      }
    }
    // Add top high-volume remote tech categories
    const commonTags = ['dev', 'engineer', 'frontend', 'backend', 'fullstack', 'devops', 'software'];
    for (const tag of commonTags) {
      if (query && query.toLowerCase().includes(tag)) continue;
      urls.push(`https://remoteok.com/api?tag=${tag}`);
      if (urls.length >= 5) break;
    }

    const responses = await Promise.allSettled(urls.map(u => fetchWithTimeout(u)));
    const allJobs = [];
    const seen = new Set();

    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value.ok) {
        const data = await res.value.json();
        const jobs = Array.isArray(data) ? data.slice(1) : [];
        for (const job of jobs) {
          if (!job.id || !job.position) continue;
          if (seen.has(job.id)) continue;
          seen.add(job.id);
          allJobs.push({
            id: `remoteok-${job.id}`,
            title: job.position || '',
            company: job.company || '',
            companyLogo: job.company_logo || job.logo || null,
            location: job.location || 'Worldwide',
            description: stripHtml(job.description || ''),
            descriptionHtml: job.description || '',
            url: normalizeUrl(job.url || `https://remoteok.com/remote-jobs/${job.slug || job.id}`, 'https://remoteok.com'),
            tags: job.tags || [],
            salary: (job.salary_min && job.salary_max)
              ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
              : null,
            category: (job.tags || [])[0] || 'Software',
            jobType: 'Full-Time',
            postedDate: job.date || (job.epoch ? new Date(job.epoch * 1000).toISOString() : null),
            daysAgo: daysAgo(job.date || (job.epoch ? job.epoch * 1000 : null)),
            source: 'RemoteOK'
          });
        }
      }
    }
    return allJobs;
  } catch (err) {
    console.error('RemoteOK API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from Himalayas API (multiple pages)
 */
async function fetchHimalayasJobs(query = '') {
  const allJobs = [];
  const seen = new Set();

  const addJob = (job) => {
    const id = `himalayas-${job.id || job.slug || allJobs.length}`;
    if (seen.has(id)) return;
    seen.add(id);
    allJobs.push({
      id,
      title: job.title || '',
      company: job.companyName || '',
      companyLogo: job.companyLogo || null,
      location: (job.locationRestrictions || []).join(', ') || 'Worldwide',
      description: stripHtml(job.description || ''),
      descriptionHtml: job.description || '',
      url: normalizeUrl(job.applicationLink || job.guid || job.url || job.applicationUrl, 'https://himalayas.app'),
      tags: job.tags || job.categories || [],
      salary: (job.minSalary && job.maxSalary)
        ? `${job.salaryCurrency || '$'}${(job.minSalary / 1000).toFixed(0)}k - ${job.salaryCurrency || '$'}${(job.maxSalary / 1000).toFixed(0)}k`
        : null,
      category: (job.categories || [])[0] || '',
      jobType: job.employmentType || 'Full Time',
      postedDate: job.pubDate || job.publishedDate,
      daysAgo: daysAgo(job.pubDate || job.publishedDate),
      source: 'Himalayas',
      seniority: job.seniority || null
    });
  };

  try {
    if (query) {
      // Use search endpoint when query is provided
      const response = await fetchWithTimeout(
        `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        const jobs = data.jobs || [];
        for (const job of jobs) addJob(job);
      }
    }

    // Always fetch browse feed pages for rich inventory
    const pagesToFetch = 12;
    const pagePromises = [];
    for (let page = 0; page < pagesToFetch; page++) {
      const offset = page * 20;
      pagePromises.push(
        fetchWithTimeout(`https://himalayas.app/jobs/api?offset=${offset}&limit=20`)
          .then(r => r.ok ? r.json() : { jobs: [] })
          .then(data => data.jobs || [])
          .catch(() => [])
      );
    }
    const pageResults = await Promise.allSettled(pagePromises);
    for (const res of pageResults) {
      if (res.status === 'fulfilled') {
        for (const job of res.value) addJob(job);
      }
    }
  } catch (err) {
    console.error('Himalayas API error:', err.message);
  }

  return allJobs;
}

/**
 * Fetch jobs from Arbeitnow API (multiple pages)
 */
async function fetchArbeitnowJobs() {
  const allJobs = [];
  const pagesToFetch = 8;
  const pagePromises = [];

  try {
    for (let page = 1; page <= pagesToFetch; page++) {
      pagePromises.push(
        fetchWithTimeout(`https://www.arbeitnow.com/api/job-board-api?page=${page}`)
          .then(r => r.ok ? r.json() : { data: [] })
          .then(data => data.data || [])
          .catch(() => [])
      );
    }

    const results = await Promise.allSettled(pagePromises);
    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const job of res.value) {
          if (!job.remote) continue;
          allJobs.push({
            id: `arbeitnow-${job.slug || allJobs.length}`,
            title: job.title || '',
            company: job.company_name || '',
            companyLogo: null,
            location: job.location || 'Remote',
            description: stripHtml(job.description || ''),
            descriptionHtml: job.description || '',
            url: normalizeUrl(job.url, 'https://www.arbeitnow.com'),
            tags: job.tags || [],
            salary: null,
            category: (job.tags || [])[0] || 'Software',
            jobType: (job.job_types || [])[0] || 'full_time',
            postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
            daysAgo: daysAgo(job.created_at ? job.created_at * 1000 : null),
            source: 'Arbeitnow'
          });
        }
      }
    }
  } catch (err) {
    console.error('Arbeitnow API error:', err.message);
  }

  return allJobs;
}

/**
 * Fetch jobs from Jobicy API
 */
async function fetchJobicyJobs(query = '') {
  try {
    const urls = [
      'https://jobicy.com/api/v2/remote-jobs?count=100',
      'https://jobicy.com/api/v2/remote-jobs?count=100&industry=engineering',
      'https://jobicy.com/api/v2/remote-jobs?count=100&industry=dev'
    ];
    if (query) {
      urls.unshift(`https://jobicy.com/api/v2/remote-jobs?count=100&tag=${encodeURIComponent(query)}`);
    }

    const responses = await Promise.allSettled(urls.map(u => fetchWithTimeout(u)));
    const allJobs = [];
    const seen = new Set();

    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value.ok) {
        const data = await res.value.json();
        const jobs = data.jobs || [];
        for (const job of jobs) {
          const jobId = job.id || job.url;
          if (!jobId || seen.has(jobId)) continue;
          seen.add(jobId);

          const rawSalary = (job.annualSalaryMin && job.annualSalaryMax)
            ? `${job.salaryCurrency || '$'}${job.annualSalaryMin} - ${job.annualSalaryMax}`
            : ((job.salaryMin && job.salaryMax) ? `${job.salaryCurrency || '$'}${job.salaryMin} - ${job.salaryMax}` : null);

          allJobs.push({
            id: `jobicy-${jobId}`,
            title: (job.jobTitle || '').replace(/\s*\((?:Fully\s+)?Remote\)/i, '').trim(),
            company: (job.companyName || '').trim(),
            companyLogo: job.companyLogo || null,
            location: (job.jobGeo || 'Worldwide').replace(/\s{2,}/g, ' ').trim(),
            description: stripHtml(job.jobDescription || job.jobExcerpt || ''),
            descriptionHtml: job.jobDescription || '',
            url: normalizeUrl(job.url, 'https://jobicy.com'),
            tags: safeTags(job.jobIndustry),
            salary: formatSalary(rawSalary),
            category: Array.isArray(job.jobIndustry) ? String(job.jobIndustry[0] || 'Software') : String(job.jobIndustry || 'Software'),
            jobType: job.jobType || 'Full Time',
            postedDate: job.pubDate,
            daysAgo: daysAgo(job.pubDate),
            source: 'Jobicy'
          });
        }
      }
    }
    return allJobs;
  } catch (err) {
    console.error('Jobicy API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from We Work Remotely (WWR) RSS feed
 */
async function fetchWeWorkRemotelyJobs() {
  // Fetch all major WWR category feeds in parallel for maximum coverage
  const WWR_FEEDS = [
    'https://weworkremotely.com/remote-jobs.rss',
    'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
    'https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss',
    'https://weworkremotely.com/categories/remote-product-jobs.rss',
    'https://weworkremotely.com/categories/remote-design-jobs.rss',
    'https://weworkremotely.com/categories/remote-customer-support-jobs.rss'
  ];

  function parseXmlFeed(xmlText, seenIds) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
      const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);
      const regionMatch = itemContent.match(/<region>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/region>/i);
      const categoryMatch = itemContent.match(/<category>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/i);

      let fullTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').trim() : '';
      if (!fullTitle) continue;

      const rawLink = linkMatch ? linkMatch[1].trim() : '';
      const itemId = `wwr-${rawLink || fullTitle}`;
      if (seenIds.has(itemId)) continue;
      seenIds.add(itemId);

      let company = 'WWR Employer';
      let title = fullTitle;
      if (fullTitle.includes(':')) {
        const parts = fullTitle.split(':');
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      const rawDesc = descMatch ? descMatch[1] : '';
      const pubDate = pubDateMatch ? pubDateMatch[1] : null;
      const rawLocation = regionMatch ? regionMatch[1].replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').trim() : 'Worldwide';

      items.push({
        id: itemId,
        title: title || fullTitle,
        company,
        companyLogo: null,
        location: rawLocation || 'Worldwide',
        description: stripHtml(rawDesc),
        descriptionHtml: rawDesc,
        url: normalizeUrl(rawLink || null, 'https://weworkremotely.com'),
        tags: categoryMatch ? [categoryMatch[1].replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').trim()] : [],
        salary: null,
        category: categoryMatch ? categoryMatch[1].replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').trim() : 'Software',
        jobType: 'Full-Time',
        postedDate: pubDate,
        daysAgo: daysAgo(pubDate),
        source: 'We Work Remotely'
      });
    }
    return items;
  }

  try {
    const seenIds = new Set();
    const allItems = [];
    const responses = await Promise.allSettled(WWR_FEEDS.map(url => fetchWithTimeout(url)));
    for (const result of responses) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const xml = await result.value.text();
        allItems.push(...parseXmlFeed(xml, seenIds));
      }
    }
    return allItems;
  } catch (err) {
    console.error('We Work Remotely API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from Jobspresso RSS feed
 */
async function fetchJobspressoJobs() {
  try {
    const response = await fetchWithTimeout('https://jobspresso.co/feed/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
      const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);

      let fullTitle = titleMatch ? titleMatch[1].trim() : '';
      let company = 'Jobspresso Employer';
      let title = fullTitle;

      if (fullTitle.includes(' at ')) {
        const parts = fullTitle.split(' at ');
        title = parts[0].trim();
        company = parts.slice(1).join(' at ').trim();
      }

      const rawDesc = descMatch ? descMatch[1] : '';
      const cleanDesc = stripHtml(rawDesc);
      const pubDate = pubDateMatch ? pubDateMatch[1] : null;

      items.push({
        id: `jobspresso-${linkMatch ? linkMatch[1] : items.length}`,
        title: title || fullTitle,
        company: company,
        companyLogo: null,
        location: 'Worldwide Remote',
        description: cleanDesc,
        descriptionHtml: rawDesc,
        url: normalizeUrl(linkMatch ? linkMatch[1] : null, 'https://jobspresso.co'),
        tags: ['Remote'],
        salary: null,
        category: 'Tech & Remote',
        jobType: 'Full-Time',
        postedDate: pubDate,
        daysAgo: daysAgo(pubDate),
        source: 'Jobspresso'
      });
    }

    return items;
  } catch (err) {
    console.error('Jobspresso API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from Working Nomads API
 */
async function fetchWorkingNomadsJobs() {
  try {
    const response = await fetchWithTimeout('https://www.workingnomads.com/api/exposed_jobs/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((job, index) => {
      const pubDate = job.pub_date || null;
      const tags = (job.tags || '').split(/[,;]+/).map(t => t.trim()).filter(Boolean);
      return {
        id: `workingnomads-${job.url || index}`,
        title: job.title || 'Remote Position',
        company: job.company_name || 'Working Nomads Employer',
        companyLogo: null,
        location: job.location || 'Worldwide Remote',
        description: stripHtml(job.description || ''),
        descriptionHtml: job.description || '',
        url: normalizeUrl(job.url, 'https://www.workingnomads.com'),
        tags: tags.length > 0 ? tags : ['Remote'],
        salary: null,
        category: job.category_name || 'Software Development',
        jobType: 'Full-Time',
        postedDate: pubDate,
        daysAgo: daysAgo(pubDate),
        source: 'Working Nomads'
      };
    });
  } catch (err) {
    console.error('Working Nomads API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from NoDesk RSS feed
 */
async function fetchNoDeskJobs() {
  try {
    const response = await fetchWithTimeout('https://nodesk.co/remote-jobs/index.xml');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
      const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);

      let fullTitle = titleMatch ? titleMatch[1].trim() : '';
      let company = 'NoDesk Employer';
      let title = fullTitle;

      if (fullTitle.includes(' at ')) {
        const parts = fullTitle.split(' at ');
        title = parts[0].trim();
        company = parts.slice(1).join(' at ').trim();
      }

      const rawDesc = descMatch ? descMatch[1] : '';
      const cleanDesc = stripHtml(rawDesc);
      const pubDate = pubDateMatch ? pubDateMatch[1] : null;

      items.push({
        id: `nodesk-${linkMatch ? linkMatch[1] : items.length}`,
        title: title || fullTitle,
        company: company,
        companyLogo: null,
        location: 'Worldwide Remote',
        description: cleanDesc,
        descriptionHtml: rawDesc,
        url: normalizeUrl(linkMatch ? linkMatch[1] : null, 'https://nodesk.co'),
        tags: ['Remote'],
        salary: null,
        category: 'Tech & Remote',
        jobType: 'Full-Time',
        postedDate: pubDate,
        daysAgo: daysAgo(pubDate),
        source: 'NoDesk'
      });
    }

    return items;
  } catch (err) {
    console.error('NoDesk API error:', err.message);
    return [];
  }
}

/**
 * Fetch jobs from LinkedIn Remote API (Guest Endpoint)
 * Supports India Remote and Worldwide Remote without requiring authentication
 */
async function fetchLinkedInJobs(query = '', location = 'India') {
  const q = query || 'software engineer';
  const urls = [
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&f_WT=2&start=0`,
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&f_WT=2&start=25`
  ];

  try {
    const results = await Promise.allSettled(urls.map(u => fetchWithTimeout(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })));

    const jobs = [];
    const seen = new Set();

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value.ok) {
        const html = await res.value.text();
        const cardRegex = /<div class=\"[^\"]*job-search-card[^\"]*\"[^>]*>([\s\S]*?)<\/li>/gi;
        let match;
        while ((match = cardRegex.exec(html)) !== null) {
          const block = match[1];
          const titleMatch = block.match(/<h3 class=\"[^\"]*base-search-card__title[^\"]*\">([\s\S]*?)<\/h3>/i);
          const linkMatch = block.match(/<a class=\"[^\"]*base-card__full-link[^\"]*\" href=\"([^\"]*)\"/i);
          const companyMatch = block.match(/<h4 class=\"[^\"]*base-search-card__subtitle[^\"]*\">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>|class=\"[^\"]*base-search-card__subtitle[^\"]*\">([\s\S]*?)<\/h4>/i);
          const locMatch = block.match(/<span class=\"[^\"]*job-search-card__location[^\"]*\">([\s\S]*?)<\/span>/i);
          const timeMatch = block.match(/<time[^>]*datetime=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/time>/i);
          const logoMatch = block.match(/<img[^>]*data-delayed-url=\"([^\"]*)\"[^>]*>|<img[^>]*src=\"([^\"]*)\"[^>]*>/i);

          const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          const company = companyMatch ? (companyMatch[1] || companyMatch[2] || '').replace(/<[^>]*>/g, '').trim() : 'Company';
          const link = linkMatch ? linkMatch[1].split('?')[0] : '';
          const loc = locMatch ? locMatch[1].replace(/<[^>]*>/g, '').trim() : `${location} (Remote)`;
          const postedDate = timeMatch ? (timeMatch[1] || timeMatch[2]?.trim()) : null;
          const logo = logoMatch ? (logoMatch[1] || logoMatch[2]) : null;

          if (title && link && !seen.has(link)) {
            seen.add(link);
            jobs.push({
              id: `linkedin-${link.replace(/[^a-zA-Z0-9]/g, '').slice(-25)}`,
              title,
              company,
              companyLogo: logo,
              location: loc,
              description: `${title} at ${company} in ${loc}. Remote position verified via LinkedIn.`,
              descriptionHtml: `<p><strong>Position:</strong> ${title}</p><p><strong>Company:</strong> ${company}</p><p><strong>Location:</strong> ${loc}</p><p>This is an active Remote position verified on LinkedIn. Click the button above to view the full job posting and apply directly on LinkedIn.</p>`,
              url: link,
              tags: ['LinkedIn', 'Remote', location === 'India' ? 'India' : 'Worldwide'],
              salary: null,
              category: 'Software & Engineering',
              jobType: 'Full-Time',
              postedDate: postedDate || new Date().toISOString(),
              daysAgo: daysAgo(postedDate),
              source: 'LinkedIn'
            });
          }
        }
      }
    }
    return jobs;
  } catch (err) {
    console.error('LinkedIn API error:', err.message);
    return [];
  }
}

/**
 * Ensures a job is strictly 100% fully remote by filtering out genuine hybrid/onsite/office requirements
 */
function isFullyRemoteJob(job) {
  if (!job) return false;
  const titleLoc = `${job.title || ''} ${job.location || ''}`.toLowerCase();
  const descStart = (job.description || '').substring(0, 500).toLowerCase();

  // If the location explicitly specifies Hybrid or Onsite
  if (/\b(hybrid|on-site|onsite|in-office|in office|relocation required)\b/i.test(job.location || '')) {
    return false;
  }

  // If the title explicitly mentions hybrid or onsite
  if (/\b(hybrid|on-site|onsite|in-person)\b/i.test(job.title || '')) {
    return false;
  }

  // If the very beginning of the role requirements specifies mandatory office attendance
  if (/\b(must work from office|mandatory in-office|not a remote position|no remote)\b/i.test(descStart)) {
    return false;
  }

  return true;
}

// ─── Main Search Function ────────────────────────────────────────────────────

/**
 * Search all job APIs, filter, score, and categorize results
 */
async function searchJobs(resumeData) {
  const { skills, titles, experience, keywords } = resumeData;
  const resumeSkillNames = skills?.all || [];
  const resumeTitleNames = titles || [];
  const resumeKeywords = keywords || [];
  const experienceLevel = experience?.level || 'mid';

  // Determine primary search query for targeted API calls
  const isDirectSearch = (resumeData.fileName || '').startsWith('Direct Search:');
  const stopQueryWords = /^(the|and|for|with|r|v|k|s|p|senior|junior|lead|staff|principal)$/i;

  let primaryQuery = '';
  let secondaryQuery = '';

  if (isDirectSearch && resumeKeywords.length > 0) {
    primaryQuery = resumeKeywords.find(k => k && k.length >= 2 && !stopQueryWords.test(k)) || '';
    secondaryQuery = resumeKeywords.find(k => k && k.length >= 2 && k.toLowerCase() !== primaryQuery.toLowerCase() && !stopQueryWords.test(k)) || '';
  } else {
    // For uploaded resumes, prioritize top technical skill or verified title for external API query
    primaryQuery = (
      resumeSkillNames.find(s => s && s.length >= 3 && !stopQueryWords.test(s)) ||
      resumeTitleNames.find(t => t && t.length >= 4) ||
      resumeKeywords.find(k => k && k.length >= 2 && !stopQueryWords.test(k)) ||
      ''
    );
    secondaryQuery = (
      resumeSkillNames.find(s => s && s.length >= 3 && s.toLowerCase() !== primaryQuery.toLowerCase() && !stopQueryWords.test(s)) ||
      resumeTitleNames.find(t => t && t.length >= 4 && t.toLowerCase() !== primaryQuery.toLowerCase()) ||
      resumeKeywords.find(k => k && k.length >= 2 && k.toLowerCase() !== primaryQuery.toLowerCase() && !stopQueryWords.test(k)) ||
      ''
    );
  }

  console.log(`\n🔍 Searching jobs across all major remote platforms for: ${resumeSkillNames.length} skills, ${resumeKeywords.length} keywords, ${resumeTitleNames.length} titles`);
  console.log(`   Primary query: "${primaryQuery}" | Secondary: "${secondaryQuery}"`);

  const startTime = Date.now();

  // Fetch live from all major remote APIs, RSS feeds, and LinkedIn in parallel
  const [
    remotiveJobs,
    remoteOKJobs,
    himalayasJobs,
    arbeitnowJobs,
    jobicyJobs,
    wwrJobs,
    jobspressoJobs,
    workingNomadsJobs,
    nodeskJobs,
    linkedInIndiaJobs,
    linkedInGlobalJobs
  ] = await Promise.all([
    fetchRemotiveJobs(primaryQuery),
    fetchRemoteOKJobs(primaryQuery),
    fetchHimalayasJobs(primaryQuery),
    fetchArbeitnowJobs(),
    fetchJobicyJobs(primaryQuery),
    fetchWeWorkRemotelyJobs(),
    fetchJobspressoJobs(),
    fetchWorkingNomadsJobs(),
    fetchNoDeskJobs(),
    fetchLinkedInJobs(primaryQuery || secondaryQuery, 'India'),
    fetchLinkedInJobs(primaryQuery || secondaryQuery, 'Worldwide')
  ]);

  const sourceStats = {
    remotive: remotiveJobs.length,
    remoteOK: remoteOKJobs.length,
    himalayas: himalayasJobs.length,
    arbeitnow: arbeitnowJobs.length,
    jobicy: jobicyJobs.length,
    weWorkRemotely: wwrJobs.length,
    jobspresso: jobspressoJobs.length,
    workingNomads: workingNomadsJobs.length,
    nodesk: nodeskJobs.length,
    linkedInIndia: linkedInIndiaJobs.length,
    linkedInGlobal: linkedInGlobalJobs.length
  };

  console.log(`📡 Fetched: Remotive(${sourceStats.remotive}), RemoteOK(${sourceStats.remoteOK}), Himalayas(${sourceStats.himalayas}), Arbeitnow(${sourceStats.arbeitnow}), Jobicy(${sourceStats.jobicy}), WWR(${sourceStats.weWorkRemotely}), LinkedInIndia(${sourceStats.linkedInIndia}), LinkedInGlobal(${sourceStats.linkedInGlobal}), WorkingNomads(${sourceStats.workingNomads}), NoDesk(${sourceStats.nodesk})`);

  // Combine all jobs from all major remote platforms + LinkedIn
  let allJobs = [
    ...remotiveJobs,
    ...remoteOKJobs,
    ...himalayasJobs,
    ...arbeitnowJobs,
    ...jobicyJobs,
    ...wwrJobs,
    ...jobspressoJobs,
    ...workingNomadsJobs,
    ...nodeskJobs,
    ...linkedInIndiaJobs,
    ...linkedInGlobalJobs
  ];
  const totalFetched = allJobs.length;

  // STRICT 100% FULLY REMOTE PURITY FILTER
  // Discard any role mentioning hybrid, onsite, in-person, or office requirements
  allJobs = allJobs.filter(isFullyRemoteJob);
  console.log(`🌐 After Fully Remote filter: ${allJobs.length} of ${totalFetched} jobs retained`);

  // Deduplicate jobs across overlapping platforms & queries
  const seenUrls = new Set();
  const seenCompanyTitles = new Set();
  const deduplicated = [];

  for (const job of allJobs) {
    const normUrl = (job.url || '').toLowerCase().replace(/https?:\/\//, '').replace(/\/$/, '');
    const normKey = `${(job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${(job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (normUrl && seenUrls.has(normUrl)) continue;
    if (normKey.length > 6 && seenCompanyTitles.has(normKey)) continue;

    if (normUrl) seenUrls.add(normUrl);
    if (normKey.length > 6) seenCompanyTitles.add(normKey);

    deduplicated.push(job);
  }
  allJobs = deduplicated;
  console.log(`✨ After deduplication: ${allJobs.length} unique jobs retained`);

  // Filter by date: default to last 60 days (or custom maxDays from UI)
  // Jobs with no date information are kept (benefit of doubt — many RSS feeds omit dates)
  const maxDays = resumeData.maxDays !== undefined ? parseInt(resumeData.maxDays, 10) : 60;
  if (maxDays > 0) {
    allJobs = allJobs.filter(job => {
      if (job.daysAgo === null || job.daysAgo === undefined) return true; // Keep if no date
      return job.daysAgo <= maxDays;
    });
  }

  console.log(`📅 After ${maxDays > 0 ? maxDays + '-day' : 'all-time'} date filter: ${allJobs.length} jobs`);

  // Score each job against resume (using BOTH skills AND keywords)
  allJobs = allJobs.map(job => {
    const { score, matchedSkills, matchedKeywords } = calculateMatchScore(
      job, resumeSkillNames, resumeTitleNames, experienceLevel, resumeKeywords
    );
    const locationInfo = classifyJobRegion(job);

    return {
      ...job,
      matchScore: score,
      matchedSkills,
      matchedKeywords,
      regionInfo: locationInfo
    };
  });

  // Filter matched jobs with positive score (> 0)
  let matchedJobs = allJobs.filter(job => job.matchScore > 0);

  console.log(`🎯 Matched: ${matchedJobs.length} jobs`);

  // Classify into Worldwide (100% borderless), India-Eligible, and All Global Remote
  const worldwideJobs = [];
  const indiaJobs = [];
  const globalJobs = [];

  for (const job of matchedJobs) {
    if (job.regionInfo && job.regionInfo.isWorldwide) {
      worldwideJobs.push({ ...job, region: 'worldwide' });
    }
    if (job.regionInfo && job.regionInfo.indiaEligible) {
      indiaJobs.push({ ...job, region: 'india' });
    }
    globalJobs.push({ ...job, region: 'global' });
  }

  // Sort by match score (descending), then by date (newest first)
  const sortJobs = (jobs) => jobs.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return (a.daysAgo || 99) - (b.daysAgo || 99);
  });

  sortJobs(worldwideJobs);
  sortJobs(indiaJobs);
  sortJobs(globalJobs);

  const searchDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✅ Results: ${worldwideJobs.length} Worldwide, ${indiaJobs.length} India Remote, ${globalJobs.length} Global Remote`);
  console.log(`⏱  Search completed in ${searchDuration}s\n`);

  // Smart salary & seniority extractors
  const extractSalaryFromText = (text) => {
    if (!text) return null;
    const match = text.match(/\b(?:\$|€|£|₹|USD|EUR|GBP|INR)\s*\d{1,3}(?:,\d{3})*(?:\s*(?:k|lpa|\/year|\/mo|\/hr|k\/year|k\/yr))(?:\s*(?:-|to)\s*(?:\$|€|£|₹|USD|EUR|GBP|INR)?\s*\d{1,3}(?:,\d{3})*(?:\s*(?:k|lpa|\/year|\/mo|\/hr|k\/year|k\/yr)))?/i);
    return match ? match[0].trim() : null;
  };

  const detectSeniority = (title, text) => {
    const t = (title || '').toLowerCase();
    const combined = `${t} ${(text || '').substring(0, 1000)}`.toLowerCase();
    if (/\b(lead|principal|director|head of|vp|staff|architect)\b/i.test(t)) return 'Lead / Principal';
    if (/\b(senior|sr\.?|sr\b)\b/i.test(t)) return 'Senior (5+ yrs)';
    if (/\b(junior|jr\.?|jr\b|entry level|graduate|intern|associate)\b/i.test(t)) return 'Entry / Junior (0-2 yrs)';
    if (/\b(mid|intermediate)\b/i.test(t)) return 'Mid-Level (3-5 yrs)';
    if (/\b(5\+|6\+|7\+|8\+|10\+)\s*(?:years|yrs)/i.test(combined)) return 'Senior (5+ yrs)';
    if (/\b(3\+|4\+|3-5|4-6)\s*(?:years|yrs)/i.test(combined)) return 'Mid-Level (3-5 yrs)';
    if (/\b(1\+|2\+|1-3|0-2)\s*(?:years|yrs)/i.test(combined)) return 'Entry (1-3 yrs)';
    return 'All Experience Levels';
  };

  // Prepare clean response with rich metadata
  const cleanJob = (job) => {
    const derivedSalary = job.salary || extractSalaryFromText(job.description) || null;
    const derivedSeniority = job.seniority || detectSeniority(job.title, job.description);

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      description: (job.description || '').substring(0, 600),
      fullDescription: job.description,
      descriptionHtml: job.descriptionHtml || job.description || '',
      url: job.url,
      tags: safeTags(job.tags).flat(Infinity).map(t => typeof t === 'string' ? t : (t && t.name ? t.name : String(t || ''))).filter(Boolean).slice(0, 10),
      salary: derivedSalary,
      seniority: derivedSeniority,
      category: Array.isArray(job.category) ? String(job.category[0] || '') : String(job.category || ''),
      jobType: Array.isArray(job.jobType) ? String(job.jobType[0] || 'Full Time') : String(job.jobType || 'Full Time'),
      postedDate: job.postedDate,
      daysAgo: job.daysAgo,
      source: job.source,
      matchScore: job.matchScore,
      matchedSkills: job.matchedSkills,
      matchedKeywords: job.matchedKeywords || [],
      region: job.region,
      regionInfo: job.regionInfo || null,
      remoteType: job.regionInfo?.remoteType || 'country_restricted',
      remoteTypeLabel: job.regionInfo?.remoteTypeLabel || 'Country-Specific Remote',
      countryScope: job.regionInfo?.countryScope || 'other',
      countryLabel: job.regionInfo?.countryLabel || job.location
    };
  };

  return {
    worldwide: worldwideJobs.map(cleanJob),
    india: indiaJobs.map(cleanJob),
    global: globalJobs.map(cleanJob),
    stats: {
      totalFetched,
      totalAfterDateFilter: allJobs.length,
      totalMatched: matchedJobs.length,
      worldwideCount: worldwideJobs.length,
      indiaCount: indiaJobs.length,
      globalCount: globalJobs.length,
      searchDuration: `${searchDuration}s`,
      sources: sourceStats,
      timestamp: new Date().toISOString()
    }
  };
}

module.exports = { searchJobs, classifyJobRegion, calculateMatchScore, isFullyRemoteJob, isAustraliaNZ };
