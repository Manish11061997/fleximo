const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE SKILLS DATABASE (300+ skills organized by category)
// ═══════════════════════════════════════════════════════════════════════════════

const SKILLS_DB = {
  languages: [
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'go',
    'golang', 'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl',
    'dart', 'elixir', 'clojure', 'haskell', 'lua', 'shell', 'bash', 'powershell',
    'sql', 'plsql', 'pl/sql', 'html', 'html5', 'css', 'css3', 'sass', 'scss',
    'less', 'solidity', 'objective-c', 'assembly', 'groovy', 'julia', 'cobol',
    'fortran', 'erlang', 'f#', 'ocaml', 'zig', 'nim', 'crystal', 'v', 'wasm',
    'webassembly'
  ],
  frontend: [
    'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs',
    'vue.js', 'svelte', 'sveltekit', 'next.js', 'nextjs', 'nuxt', 'nuxtjs',
    'nuxt.js', 'gatsby', 'remix', 'astro', 'qwik', 'solid.js', 'solidjs',
    'preact', 'alpine.js', 'alpinejs', 'htmx', 'jquery', 'bootstrap',
    'tailwind', 'tailwindcss', 'tailwind css', 'material ui', 'material-ui',
    'mui', 'chakra ui', 'chakra-ui', 'ant design', 'antd', 'shadcn',
    'radix ui', 'headless ui', 'redux', 'mobx', 'zustand', 'recoil', 'jotai',
    'tanstack', 'react query', 'swr', 'webpack', 'vite', 'babel', 'rollup',
    'parcel', 'esbuild', 'turbopack', 'storybook', 'emotion', 'styled-components',
    'three.js', 'threejs', 'd3', 'd3.js', 'chart.js', 'highcharts', 'echarts',
    'framer motion', 'gsap', 'lottie', 'webgl', 'canvas', 'svg', 'pwa',
    'progressive web app', 'service worker', 'web components', 'lit',
    'stimulus', 'turbo', 'hotwire'
  ],
  backend: [
    'node.js', 'nodejs', 'node', 'express', 'expressjs', 'express.js', 'django',
    'flask', 'fastapi', 'spring', 'spring boot', 'springboot', 'rails',
    'ruby on rails', 'laravel', 'symfony', 'codeigniter', 'asp.net', '.net',
    'dotnet', '.net core', 'nestjs', 'nest.js', 'koa', 'hapi', 'fastify',
    'gin', 'echo', 'fiber', 'actix', 'axum', 'rocket', 'phoenix', 'sinatra',
    'tornado', 'sanic', 'aiohttp', 'deno', 'bun', 'grails', 'micronaut',
    'quarkus', 'vert.x', 'akka', 'play framework'
  ],
  databases: [
    'postgresql', 'postgres', 'mysql', 'mariadb', 'mongodb', 'redis',
    'memcached', 'elasticsearch', 'opensearch', 'dynamodb', 'cassandra',
    'scylladb', 'sqlite', 'oracle', 'oracle db', 'sql server', 'mssql',
    'firebase', 'firestore', 'realtime database', 'couchdb', 'couchbase',
    'neo4j', 'arangodb', 'cockroachdb', 'cockroach', 'supabase', 'planetscale',
    'neon', 'turso', 'drizzle', 'prisma', 'sequelize', 'mongoose', 'typeorm',
    'knex', 'sqlalchemy', 'hibernate', 'active record', 'dapper', 'entity framework',
    'clickhouse', 'timescaledb', 'influxdb', 'questdb', 'fauna', 'faunadb',
    'hasura', 'postgrest', 'edgedb'
  ],
  cloud: [
    'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp',
    'google cloud', 'google cloud platform', 'heroku', 'digitalocean',
    'linode', 'vultr', 'hetzner', 'oracle cloud', 'ibm cloud', 'alibaba cloud',
    'vercel', 'netlify', 'cloudflare', 'cloudflare workers', 'fly.io',
    'railway', 'render', 'lambda', 'ec2', 's3', 'ecs', 'eks', 'fargate',
    'cloudfront', 'route53', 'rds', 'aurora', 'sqs', 'sns', 'kinesis',
    'step functions', 'api gateway', 'cloud functions', 'cloud run',
    'app engine', 'cloud storage', 'azure functions', 'azure devops',
    'amplify', 'cognito', 'iam', 'vpc', 'elb', 'alb'
  ],
  devops: [
    'docker', 'kubernetes', 'k8s', 'openshift', 'podman', 'containerd',
    'jenkins', 'github actions', 'gitlab ci', 'gitlab ci/cd', 'circleci',
    'travis ci', 'bamboo', 'teamcity', 'argo cd', 'argocd', 'flux',
    'spinnaker', 'tekton', 'terraform', 'pulumi', 'crossplane',
    'cloudformation', 'cdk', 'ansible', 'puppet', 'chef', 'salt',
    'saltstack', 'nginx', 'apache', 'caddy', 'traefik', 'envoy', 'istio',
    'linkerd', 'consul', 'vault', 'helm', 'kustomize', 'prometheus',
    'grafana', 'datadog', 'new relic', 'splunk', 'elk stack', 'elastic stack',
    'logstash', 'kibana', 'fluentd', 'loki', 'jaeger', 'zipkin',
    'opentelemetry', 'pagerduty', 'opsgenie', 'vagrant', 'packer',
    'trivy', 'snyk', 'sonarqube', 'sonar'
  ],
  data_ml: [
    'tensorflow', 'pytorch', 'jax', 'scikit-learn', 'sklearn', 'xgboost',
    'lightgbm', 'catboost', 'pandas', 'numpy', 'scipy', 'matplotlib',
    'seaborn', 'plotly', 'keras', 'opencv', 'pillow', 'spark', 'pyspark',
    'hadoop', 'mapreduce', 'hive', 'pig', 'airflow', 'dagster', 'prefect',
    'luigi', 'dbt', 'fivetran', 'airbyte', 'stitch', 'tableau', 'power bi',
    'looker', 'metabase', 'superset', 'snowflake', 'databricks', 'redshift',
    'bigquery', 'athena', 'glue', 'emr', 'kafka', 'confluent', 'flink',
    'beam', 'storm', 'nifi', 'mlflow', 'kubeflow', 'sagemaker', 'vertex ai',
    'hugging face', 'huggingface', 'transformers', 'langchain', 'llamaindex',
    'openai', 'anthropic', 'gpt', 'chatgpt', 'claude', 'gemini', 'llm',
    'large language model', 'rag', 'retrieval augmented', 'fine-tuning',
    'prompt engineering', 'nlp', 'natural language processing',
    'computer vision', 'deep learning', 'machine learning', 'reinforcement learning',
    'neural network', 'cnn', 'rnn', 'lstm', 'transformer', 'bert', 'gpt-4',
    'diffusion model', 'stable diffusion', 'generative ai', 'gen ai',
    'data science', 'data engineering', 'data analysis', 'data analytics',
    'business intelligence', 'etl', 'elt', 'data pipeline', 'data warehouse',
    'data lake', 'data lakehouse', 'delta lake', 'iceberg', 'hudi',
    'feature store', 'model serving', 'mlops', 'a/b testing', 'experimentation'
  ],
  mobile: [
    'react native', 'flutter', 'swiftui', 'uikit', 'jetpack compose',
    'android sdk', 'ios sdk', 'xamarin', 'maui', '.net maui', 'ionic',
    'cordova', 'capacitor', 'expo', 'android', 'ios', 'mobile development',
    'app development', 'kotlin multiplatform', 'kmp'
  ],
  testing: [
    'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium', 'webdriver',
    'playwright', 'puppeteer', 'pytest', 'unittest', 'nose', 'rspec',
    'minitest', 'junit', 'testng', 'mockito', 'vitest', 'testing library',
    'react testing library', 'enzyme', 'supertest', 'k6', 'gatling',
    'jmeter', 'locust', 'artillery', 'postman', 'insomnia', 'bruno',
    'hurl', 'karate', 'robot framework', 'appium', 'detox', 'maestro',
    'browserstack', 'sauce labs', 'percy', 'chromatic', 'cucumber', 'behave',
    'codecov', 'coveralls', 'istanbul', 'nyc', 'test automation',
    'performance testing', 'load testing', 'integration testing',
    'end-to-end testing', 'e2e testing', 'unit testing', 'regression testing'
  ],
  security: [
    'owasp', 'penetration testing', 'pen testing', 'vulnerability assessment',
    'sast', 'dast', 'iast', 'rasp', 'waf', 'firewall', 'ids', 'ips',
    'siem', 'soar', 'zero trust', 'devsecops', 'security audit',
    'incident response', 'threat modeling', 'cryptography', 'ssl', 'tls',
    'https', 'certificate', 'pki', 'kms', 'hsm', 'soc2', 'soc 2',
    'iso 27001', 'pci dss', 'hipaa', 'fedramp', 'nist', 'cis benchmark',
    'cloud security', 'application security', 'network security',
    'information security', 'cybersecurity', 'cyber security',
    'identity management', 'access control', 'rbac', 'abac'
  ],
  tools_practices: [
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
    'jira', 'confluence', 'slack', 'teams', 'discord',
    'figma', 'sketch', 'adobe xd', 'invision', 'zeplin', 'abstract',
    'notion', 'linear', 'asana', 'trello', 'monday', 'clickup', 'basecamp',
    'vs code', 'visual studio', 'intellij', 'webstorm', 'pycharm', 'goland',
    'vim', 'neovim', 'emacs', 'sublime text', 'atom',
    'rest', 'restful', 'rest api', 'graphql', 'grpc', 'protobuf',
    'websocket', 'socket.io', 'sse', 'webhook', 'oauth', 'oauth2',
    'openid connect', 'oidc', 'jwt', 'json web token', 'saml', 'sso',
    'single sign-on', 'ldap', 'active directory',
    'agile', 'scrum', 'kanban', 'lean', 'safe', 'extreme programming', 'xp',
    'ci/cd', 'cicd', 'continuous integration', 'continuous delivery',
    'continuous deployment', 'devops', 'gitops', 'infrastructure as code',
    'iac', 'configuration management',
    'microservices', 'monolith', 'modular monolith', 'serverless', 'faas',
    'event-driven', 'event driven architecture', 'eda', 'cqrs',
    'event sourcing', 'domain-driven design', 'ddd', 'clean architecture',
    'hexagonal architecture', 'onion architecture',
    'message queue', 'message broker', 'rabbitmq', 'activemq', 'zeromq',
    'pub/sub', 'publish subscribe', 'nats',
    'caching', 'cdn', 'load balancing', 'rate limiting', 'circuit breaker',
    'api gateway', 'service mesh', 'api design', 'openapi', 'swagger',
    'tdd', 'bdd', 'atdd', 'solid', 'dry', 'kiss', 'yagni',
    'design patterns', 'system design', 'distributed systems',
    'high availability', 'fault tolerance', 'scalability', 'resilience',
    'oop', 'object oriented', 'functional programming', 'reactive programming',
    'concurrent programming', 'parallel programming', 'async',
    'authentication', 'authorization', 'encryption', 'hashing',
    'compliance', 'gdpr', 'ccpa', 'accessibility', 'a11y', 'wcag',
    'seo', 'core web vitals', 'performance optimization',
    'responsive design', 'mobile first', 'cross-browser',
    'spa', 'ssr', 'ssg', 'isr', 'jamstack', 'headless cms',
    'contentful', 'strapi', 'sanity', 'prismic', 'ghost',
    'wordpress', 'drupal', 'magento', 'shopify', 'woocommerce',
    'web3', 'blockchain', 'ethereum', 'defi', 'nft', 'smart contract',
    'ipfs', 'web5', 'decentralized'
  ],
  salesforce: [
    'salesforce', 'apex', 'lwc', 'lightning web components', 'visualforce',
    'soql', 'sosl', 'sales cloud', 'service cloud', 'experience cloud',
    'marketing cloud', 'commerce cloud', 'financial services cloud',
    'salesforce admin', 'salesforce developer', 'salesforce architect',
    'salesforce lightning', 'process builder', 'flow builder', 'omnistudio',
    'copado', 'flosum', 'salesforce crm'
  ]
};

// Flatten all skills into a single lookup Set for fast matching
const ALL_SKILLS = new Set();
const SKILL_TO_CATEGORY = new Map();
const PRECOMPILED_SKILLS = [];

function initPrecompiledSkills() {
  if (PRECOMPILED_SKILLS.length > 0) return;
  for (const [category, skills] of Object.entries(SKILLS_DB)) {
    for (const skill of skills) {
      const lower = skill.toLowerCase();
      ALL_SKILLS.add(lower);
      SKILL_TO_CATEGORY.set(lower, category);
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?:^|[\\s,;()\\[\\]{}|/•·\\-])${escaped}(?:$|[\\s,;()\\[\\]{}|/•·\\-\\.]|$)`, 'i');
      PRECOMPILED_SKILLS.push({
        skill: lower,
        category,
        pattern,
        displayName: normalizeSkillName(skill)
      });
    }
  }
}
initPrecompiledSkills();

// ═══════════════════════════════════════════════════════════════════════════════
// JOB TITLES DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const JOB_TITLES = [
  'software engineer', 'software developer', 'web developer',
  'frontend developer', 'front-end developer', 'front end developer',
  'backend developer', 'back-end developer', 'back end developer',
  'full stack developer', 'fullstack developer', 'full-stack developer',
  'full stack engineer', 'fullstack engineer', 'full-stack engineer',
  'devops engineer', 'devsecops engineer',
  'sre', 'site reliability engineer',
  'platform engineer', 'infrastructure engineer',
  'data scientist', 'data engineer', 'data analyst', 'data architect',
  'analytics engineer', 'business intelligence analyst', 'bi analyst',
  'machine learning engineer', 'ml engineer', 'mlops engineer',
  'ai engineer', 'ai/ml engineer', 'ai researcher',
  'nlp engineer', 'computer vision engineer', 'deep learning engineer',
  'product manager', 'product owner', 'technical product manager',
  'product designer', 'ux designer', 'ui designer', 'ux/ui designer',
  'ui/ux designer', 'ux researcher', 'design engineer',
  'qa engineer', 'quality assurance', 'test engineer', 'sdet',
  'automation engineer', 'test automation engineer',
  'security engineer', 'application security engineer',
  'cloud engineer', 'cloud architect', 'solutions architect',
  'enterprise architect', 'technical architect',
  'system administrator', 'sysadmin', 'systems engineer',
  'database administrator', 'dba',
  'network engineer', 'network administrator',
  'mobile developer', 'ios developer', 'android developer',
  'react developer', 'react native developer', 'flutter developer',
  'salesforce developer', 'senior salesforce developer', 'salesforce architect', 'salesforce admin', 'salesforce administrator', 'salesforce consultant',
  'python developer', 'java developer', 'golang developer', 'rust developer',
  'node.js developer', 'nodejs developer', '.net developer',
  'blockchain developer', 'smart contract developer', 'web3 developer',
  'technical writer', 'documentation engineer',
  'technical lead', 'tech lead', 'team lead', 'lead developer',
  'lead engineer', 'principal engineer', 'staff engineer',
  'distinguished engineer', 'fellow',
  'engineering manager', 'engineering director',
  'vp of engineering', 'vp engineering', 'cto',
  'head of engineering', 'head of product', 'head of design',
  'consultant', 'technical consultant',
  'freelancer', 'contractor', 'independent contractor',
  'business analyst', 'systems analyst',
  'scrum master', 'agile coach',
  'project manager', 'program manager', 'delivery manager',
  'release manager', 'release engineer',
  'embedded engineer', 'firmware engineer', 'hardware engineer',
  'game developer', 'game engineer', 'graphics programmer',
  'support engineer', 'customer success engineer',
  'sales engineer', 'solutions engineer', 'pre-sales engineer',
  'developer advocate', 'developer relations', 'devrel',
  'developer experience', 'dx engineer'
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE LEVEL DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const EXPERIENCE_LEVELS = {
  entry: {
    keywords: ['entry level', 'entry-level', 'junior', 'jr.', 'jr ', 'fresher',
      'fresh graduate', 'new graduate', 'recent graduate', 'graduate',
      'intern', 'internship', 'apprentice', 'trainee', 'associate',
      '0-1 year', '0-2 year', '1 year of experience', '0 year'],
    yearsRange: [0, 2]
  },
  mid: {
    keywords: ['mid level', 'mid-level', 'intermediate', 'regular',
      '2-4 year', '3-5 year', '2-5 year', '3-6 year', '4-6 year',
      '2 years', '3 years', '4 years', '5 years'],
    yearsRange: [2, 6]
  },
  senior: {
    keywords: ['senior', 'sr.', 'sr ', 'lead', 'principal', 'staff',
      'distinguished', 'fellow', 'expert', 'specialist', 'architect',
      '5+ year', '6+ year', '7+ year', '8+ year', '9+ year', '10+ year',
      '5-8 year', '6-10 year', '8-12 year', '10-15 year',
      '6 years', '7 years', '8 years', '9 years', '10 years'],
    yearsRange: [5, 99]
  },
  management: {
    keywords: ['manager', 'director', 'vp', 'vice president', 'head of',
      'chief', 'cto', 'ceo', 'cfo', 'coo', 'c-level', 'executive',
      'managing', 'general manager'],
    yearsRange: [8, 99]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART KEYWORD EXTRACTION (catches terms NOT in predefined dictionary)
// ═══════════════════════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  // Articles, prepositions, conjunctions, pronouns
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'than', 'too', 'very', 'just',
  'also', 'over', 'after', 'before', 'between', 'under', 'above',
  'below', 'up', 'down', 'out', 'off', 'about', 'into', 'through',
  'during', 'until', 'against', 'among', 'throughout', 'despite',
  'towards', 'upon', 'this', 'that', 'these', 'those', 'it', 'its',
  'he', 'she', 'they', 'them', 'their', 'his', 'her', 'my', 'your',
  'our', 'we', 'you', 'me', 'him', 'us', 'i', 'who', 'whom', 'which',
  'what', 'where', 'when', 'why', 'how', 'all', 'any', 'every', 'if',
  'then', 'else', 'while', 'because', 'since', 'although', 'though',
  'whether', 'either', 'neither',
  // Common resume filler words
  'experience', 'experienced', 'work', 'working', 'worked', 'project',
  'projects', 'team', 'teams', 'company', 'organization', 'responsible',
  'responsibilities', 'developed', 'development', 'developing', 'using',
  'used', 'use', 'uses', 'various', 'including', 'include', 'included',
  'new', 'well', 'good', 'best', 'better', 'ensure', 'ensuring',
  'manage', 'managed', 'management', 'managing', 'provide', 'provided',
  'providing', 'support', 'supported', 'supporting', 'maintain',
  'maintained', 'maintaining', 'create', 'created', 'creating',
  'implement', 'implemented', 'implementing', 'implementation',
  'design', 'designed', 'designing', 'build', 'built', 'building',
  'based', 'able', 'ability', 'skills', 'skill', 'knowledge',
  'strong', 'excellent', 'proficient', 'environment', 'environments',
  'multiple', 'across', 'within', 'level', 'high', 'quality',
  'years', 'year', 'month', 'months', 'day', 'days', 'time',
  'part', 'full', 'current', 'currently', 'previous', 'previously',
  'role', 'roles', 'position', 'key', 'core', 'primary',
  'related', 'relevant', 'required', 'requirements', 'following',
  'per', 'via', 'etc', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul',
  'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march',
  'april', 'june', 'july', 'august', 'september', 'october',
  'november', 'december', 'present', 'date', 'city', 'state',
  'country', 'address', 'phone', 'email', 'linkedin', 'github',
  'portfolio', 'website', 'university', 'college', 'school', 'degree',
  'bachelor', 'master', 'certification', 'certified', 'certificate',
  'professional', 'summary', 'objective', 'education', 'achievements',
  'awards', 'references', 'available', 'request', 'contact', 'details',
  'com', 'www', 'http', 'https', 'org', 'net', 'co', 'io',
  'name', 'first', 'last', 'mr', 'mrs', 'ms', 'dr', 'sir',
  'like', 'get', 'got', 'make', 'made', 'take', 'took', 'come',
  'came', 'give', 'gave', 'go', 'went', 'gone', 'know', 'see',
  'think', 'look', 'want', 'say', 'said', 'one', 'two', 'three',
  'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many',
  'much', 'several', 'number', 'different', 'result', 'results',
  'process', 'processes', 'help', 'helped', 'helping', 'service',
  'services', 'system', 'systems', 'data', 'information',
  'technical', 'technology', 'technologies', 'solution', 'solutions',
  'client', 'clients', 'customer', 'customers', 'user', 'users',
  'product', 'products', 'platform', 'platforms', 'application',
  'applications', 'app', 'apps', 'software', 'program', 'programs',
  'code', 'coding', 'feature', 'features', 'tool', 'tools',
  'engineering', 'engineer', 'developer', 'analyst', 'specialist',
  'lead', 'senior', 'junior', 'manager', 'director', 'head',
  'intern', 'associate', 'staff', 'principal', 'vice', 'president',
  'india', 'usa', 'remote', 'onsite', 'hybrid', 'office',
  // Filter out common name initials & single letters
  'r', 'v', 'k', 's', 'p', 'm', 'n', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
  'i', 'j', 'l', 'o', 'q', 't', 'u', 'w', 'x', 'y', 'z'
]);

/**
 * Extract important keywords from resume text using frequency analysis,
 * bigram detection, and proper noun identification.
 * This catches domain-specific terms NOT in the predefined skills dictionary.
 */
function extractKeywords(text, candidateName = '') {
  if (!text || typeof text !== 'string') return [];

  // Exclude candidate name tokens from keywords
  const localStopwords = new Set(STOPWORDS);
  if (candidateName) {
    candidateName.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length >= 2) localStopwords.add(w);
    });
  }

  // Strip candidate contact info lines (email, phone, linkedin, urls) so names/emails are never keywords
  let cleanText = text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ')
    .replace(/(?:https?:\/\/|www\.)[^\s]+/gi, ' ')
    .replace(/\+?[\d\s\-\(\)]{8,20}/g, ' ')
    .replace(/\b(linkedin|github|portfolio|curriculum|resume|cv|contact|email|phone|address|tel)\b/gi, ' ');

  // Split into chunks by sentence/clause boundaries (commas, periods, semicolons, newlines, bullets)
  const chunks = cleanText.split(/[\n\r.,;:|•·\(\)\[\]{}—–\/\\]+/).map(c => c.trim()).filter(Boolean);

  const freq = {};
  const originalCase = {};

  for (const chunk of chunks) {
    const rawTokens = chunk.split(/\s+/).map(w => w.replace(/^[^\w\+#]+|[^\w\+#]+$/g, '').trim()).filter(Boolean);
    
    // Unigrams
    for (const word of rawTokens) {
      const lower = word.toLowerCase();
      if (localStopwords.has(lower)) continue;
      if (/^\d+$/.test(word)) continue;
      if (word.length < 3 && !/^(go|js|py|ai|ml|ui|ux|c|r|db|ts|qa)$/i.test(word)) continue;
      if (ALL_SKILLS.has(lower)) continue; // Skills dictionary already captures this with canonical name

      freq[lower] = (freq[lower] || 0) + 1;
      if (!originalCase[lower] || /^[A-Z]/.test(word)) {
        originalCase[lower] = word;
      }
    }

    // Bigrams within same chunk
    for (let i = 0; i < rawTokens.length - 1; i++) {
      const w1 = rawTokens[i];
      const w2 = rawTokens[i + 1];
      const l1 = w1.toLowerCase();
      const l2 = w2.toLowerCase();
      if (localStopwords.has(l1) || localStopwords.has(l2)) continue;
      if (w1.length < 2 || w2.length < 2) continue;
      const bigram = l1 + ' ' + l2;
      if (ALL_SKILLS.has(bigram)) continue;

      freq[bigram] = (freq[bigram] || 0) + 1;
      originalCase[bigram] = w1 + ' ' + w2;
    }
  }

  // Score and rank keywords
  const scored = Object.entries(freq)
    .map(([word, count]) => {
      let score = count;
      const display = originalCase[word] || word;
      if (/^[A-Z]/.test(display)) score *= 1.5;
      if (/^[A-Z][A-Z0-9\-\.]+$/.test(display)) score *= 2.5;
      if (word.includes(' ')) score *= 1.8;
      if (count >= 2) score *= 1.5;
      return { word: display, lower: word, score, count };
    })
    .filter(item => item.score >= 1.5 || item.count >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return scored.map(item => item.word);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE PARSING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a resume file (PDF or DOCX) and extract structured data
 */
async function parseResume(fileBuffer, mimeType = '', originalName = '') {
  let rawText = '';
  const name = String(originalName || mimeType || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    rawText = await extractTextFromPDF(fileBuffer);
  } else if (
    mime.includes('word') || mime.includes('officedocument') || name.endsWith('.docx')
  ) {
    rawText = await extractTextFromDOCX(fileBuffer);
  } else if (mime.includes('text') || name.endsWith('.txt') || (!mime && !name.includes('.'))) {
    rawText = fileBuffer.toString('utf-8');
  } else {
    try {
      rawText = fileBuffer.toString('utf-8');
    } catch {
      throw new Error(`Unsupported file format: ${mimeType}. Please upload a PDF, DOCX, or TXT file.`);
    }
  }

  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Could not extract enough text from the resume. The file might be scanned/image-based or empty.');
  }

  const contact = extractContactInfo(rawText, originalName);
  const skills = extractSkills(rawText);
  const titles = extractTitles(rawText);
  const experience = detectExperience(rawText);
  const keywords = extractKeywords(rawText, contact?.name);

  return {
    contact,
    skills,
    titles,
    experience,
    keywords, // Smart-extracted terms beyond the dictionary
    rawText: rawText.substring(0, 5000), // Truncate for safety
    fileName: originalName,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Extract text from a PDF buffer
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

/**
 * Extract text from a DOCX buffer
 */
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }
}

/**
 * Extract skills from resume text using precompiled high-speed pattern matching
 */
function extractSkills(text) {
  const normalizedText = text.toLowerCase();
  const foundSkills = new Map(); // displayName -> category

  if (!PRECOMPILED_SKILLS || PRECOMPILED_SKILLS.length === 0) {
    initPrecompiledSkills();
  }

  for (let i = 0; i < PRECOMPILED_SKILLS.length; i++) {
    const entry = PRECOMPILED_SKILLS[i];
    if (entry.pattern.test(normalizedText)) {
      if (!foundSkills.has(entry.displayName)) {
        foundSkills.set(entry.displayName, entry.category);
      }
    }
  }

  // Convert to structured output
  const skillsByCategory = {};
  for (const [skill, category] of foundSkills) {
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skill);
  }

  return {
    all: Array.from(foundSkills.keys()),
    byCategory: skillsByCategory,
    count: foundSkills.size
  };
}

/**
 * Normalize skill name for display
 */
function normalizeSkillName(skill) {
  const displayMap = {
    'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python',
    'java': 'Java', 'c\\+\\+': 'C++', 'c#': 'C#', 'ruby': 'Ruby',
    'go': 'Go', 'golang': 'Go', 'rust': 'Rust', 'swift': 'Swift',
    'kotlin': 'Kotlin', 'php': 'PHP', 'scala': 'Scala', 'dart': 'Dart',
    'elixir': 'Elixir', 'haskell': 'Haskell', 'lua': 'Lua',
    'sql': 'SQL', 'html': 'HTML', 'html5': 'HTML5', 'css': 'CSS',
    'css3': 'CSS3', 'sass': 'Sass', 'scss': 'SCSS',
    'react': 'React', 'reactjs': 'React', 'react.js': 'React',
    'angular': 'Angular', 'angularjs': 'Angular',
    'vue': 'Vue.js', 'vuejs': 'Vue.js', 'vue.js': 'Vue.js',
    'svelte': 'Svelte', 'sveltekit': 'SvelteKit',
    'next.js': 'Next.js', 'nextjs': 'Next.js',
    'nuxt': 'Nuxt.js', 'nuxtjs': 'Nuxt.js',
    'node.js': 'Node.js', 'nodejs': 'Node.js', 'node': 'Node.js',
    'express': 'Express', 'expressjs': 'Express',
    'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
    'spring boot': 'Spring Boot', 'springboot': 'Spring Boot',
    'rails': 'Rails', 'ruby on rails': 'Ruby on Rails',
    'laravel': 'Laravel', 'nestjs': 'NestJS', 'nest.js': 'NestJS',
    'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL',
    'mysql': 'MySQL', 'mongodb': 'MongoDB', 'redis': 'Redis',
    'elasticsearch': 'Elasticsearch', 'dynamodb': 'DynamoDB',
    'sqlite': 'SQLite', 'firebase': 'Firebase', 'supabase': 'Supabase',
    'prisma': 'Prisma', 'mongoose': 'Mongoose',
    'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP',
    'docker': 'Docker', 'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes',
    'terraform': 'Terraform', 'ansible': 'Ansible',
    'jenkins': 'Jenkins', 'github actions': 'GitHub Actions',
    'nginx': 'Nginx', 'apache': 'Apache',
    'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch',
    'scikit-learn': 'Scikit-learn', 'pandas': 'Pandas', 'numpy': 'NumPy',
    'spark': 'Apache Spark', 'kafka': 'Apache Kafka',
    'airflow': 'Apache Airflow', 'snowflake': 'Snowflake',
    'databricks': 'Databricks', 'bigquery': 'BigQuery',
    'tableau': 'Tableau', 'power bi': 'Power BI',
    'react native': 'React Native', 'flutter': 'Flutter',
    'jest': 'Jest', 'cypress': 'Cypress', 'selenium': 'Selenium',
    'playwright': 'Playwright', 'pytest': 'pytest',
    'git': 'Git', 'github': 'GitHub', 'gitlab': 'GitLab',
    'jira': 'Jira', 'figma': 'Figma',
    'graphql': 'GraphQL', 'grpc': 'gRPC', 'rest': 'REST',
    'jwt': 'JWT', 'oauth': 'OAuth', 'oauth2': 'OAuth 2.0',
    'agile': 'Agile', 'scrum': 'Scrum',
    'ci/cd': 'CI/CD', 'cicd': 'CI/CD',
    'microservices': 'Microservices', 'serverless': 'Serverless',
    'llm': 'LLM', 'openai': 'OpenAI', 'langchain': 'LangChain',
    'hugging face': 'Hugging Face', 'huggingface': 'Hugging Face',
    'nlp': 'NLP', 'machine learning': 'Machine Learning',
    'deep learning': 'Deep Learning', 'data science': 'Data Science',
    'generative ai': 'Generative AI', 'gen ai': 'Generative AI'
  };

  return displayMap[skill.toLowerCase()] || skill.charAt(0).toUpperCase() + skill.slice(1);
}

/**
 * Extract job titles mentioned in the resume
 */
function extractTitles(text) {
  const normalizedText = text.toLowerCase();
  const foundTitles = new Set();

  for (const title of JOB_TITLES) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|[\\s,;•·\\-|/])${escaped}(?:$|[\\s,;•·\\-|/\\.])`, 'i');

    if (pattern.test(normalizedText)) {
      // Capitalize each word for display
      const displayTitle = title.replace(/\b\w/g, c => c.toUpperCase());
      foundTitles.add(displayTitle);
    }
  }

  return Array.from(foundTitles);
}

/**
 * Detect experience level from resume text
 */
function detectExperience(text) {
  const normalizedText = text.toLowerCase();
  const scores = {};

  // Check keyword matches
  for (const [level, config] of Object.entries(EXPERIENCE_LEVELS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword)) {
        score++;
      }
    }
    scores[level] = score;
  }

  // Also try to extract years of experience from text (e.g. "5+ years of experience")
  const yearsPattern = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp|work)/gi;
  const matches = [...normalizedText.matchAll(yearsPattern)];
  let maxYears = 0;
  for (const match of matches) {
    const years = parseInt(match[1], 10);
    if (years > maxYears && years < 50) {
      maxYears = years;
    }
  }

  // Parse career year ranges (e.g. "2019 - 2024", "2021 - Present")
  const currentYear = new Date().getFullYear();
  const yearRangePattern = /\b(19\d{2}|20\d{2})\s*(?:-|–|—|to)\s*(19\d{2}|20\d{2}|present|current|now)\b/gi;
  const yearMatches = [...normalizedText.matchAll(yearRangePattern)];
  let minStartYear = 9999;
  let maxEndYear = 0;

  for (const ym of yearMatches) {
    const startY = parseInt(ym[1], 10);
    const endStr = ym[2].toLowerCase();
    const endY = (endStr.includes('present') || endStr.includes('current') || endStr.includes('now'))
      ? currentYear
      : parseInt(endStr, 10);

    if (startY >= 1990 && startY <= currentYear && endY >= startY && endY <= currentYear + 1) {
      if (startY < minStartYear) minStartYear = startY;
      if (endY > maxEndYear) maxEndYear = endY;
    }
  }

  if (minStartYear < 9999 && maxEndYear > 0) {
    const span = Math.max(0, maxEndYear - minStartYear);
    if (span > maxYears && span <= 40) {
      maxYears = span;
    }
  }

  // Determine level based on years if found
  if (maxYears > 0) {
    if (maxYears <= 2) scores.entry = (scores.entry || 0) + 4;
    else if (maxYears <= 5) scores.mid = (scores.mid || 0) + 4;
    else scores.senior = (scores.senior || 0) + 4;
  }

  // Find the level with highest score
  let bestLevel = 'mid'; // default
  let bestScore = 0;
  for (const [level, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLevel = level;
    }
  }

  const levelLabels = {
    entry: 'Entry Level (0-2 years)',
    mid: 'Mid Level (2-5 years)',
    senior: 'Senior Level (5+ years)',
    management: 'Management / Leadership'
  };

  return {
    level: bestLevel,
    label: levelLabels[bestLevel],
    yearsDetected: maxYears > 0 ? maxYears : null,
    confidence: bestScore > 0 ? 'high' : 'low'
  };
}

/**
 * Extract contact information (name, email, phone, links) from resume text
 */
function extractContactInfo(rawText, originalName = '') {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex) || [];
  let candidateEmail = '';
  for (const em of emailMatches) {
    const lower = em.toLowerCase();
    if (!lower.includes('example.com') && !lower.includes('domain.com') && !lower.includes('yoursite.com') && !lower.includes('placeholder.com')) {
      candidateEmail = em;
      break;
    }
  }
  if (!candidateEmail && emailMatches.length > 0) {
    candidateEmail = emailMatches[0];
  }

  // 2. Phone number extraction
  let candidatePhone = '';
  const phonePatterns = [
    /(?:(?:\+|00)91[\-\s.]?)?[6-9]\d{4}[\-\s.]?\d{5}\b/, // Indian mobile
    /(?:\+?1[\-\s.]?)?\(?\b[2-9]\d{2}\)?[\-\s.]?\d{3}[\-\s.]?\d{4}\b/, // US/North America
    /(?:\+\d{1,3}[\-\s.]?)?\(?\d{2,4}\)?[\-\s.]?\d{3,4}[\-\s.]?\d{3,4}\b/ // International general
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      candidatePhone = match[0].trim();
      break;
    }
  }

  // 3. LinkedIn extraction
  let candidateLinkedin = '';
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-\.]+)/i);
  if (linkedinMatch) {
    candidateLinkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // 4. GitHub extraction
  let candidateGithub = '';
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i);
  if (githubMatch) {
    candidateGithub = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
  }

  // 5. Portfolio / Personal website
  let candidatePortfolio = '';
  const urlMatches = text.match(/https?:\/\/[^\s,;()]+/gi) || [];
  for (const u of urlMatches) {
    const lower = u.toLowerCase();
    if (!lower.includes('linkedin.com') && !lower.includes('github.com') && !lower.includes('google.com') && !lower.includes('medium.com') && !lower.includes('twitter.com') && !lower.includes('x.com')) {
      candidatePortfolio = u;
      break;
    }
  }

  // 6. Name extraction
  let candidateName = '';
  const blacklistNameTokens = [
    'resume', 'curriculum', 'vitae', 'cv', 'summary', 'profile', 'experience',
    'education', 'skills', 'contact', 'phone', 'email', 'address', 'page',
    'portfolio', 'projects', 'developer', 'engineer', 'architect', 'manager',
    'lead', 'senior', 'junior', 'fullstack', 'full stack', 'frontend', 'backend'
  ];

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    let line = lines[i].replace(/[|•·,;()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (line.includes('@') || line.match(/https?:\/\//i) || line.match(/\d{4,}/)) continue;

    const lower = line.toLowerCase();
    const hasBlacklist = blacklistNameTokens.some(tok => lower === tok || lower.startsWith(tok + ' ') || lower.endsWith(' ' + tok));
    if (hasBlacklist) continue;

    const words = line.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 1 && words.length <= 4 && line.length >= 3 && line.length <= 35) {
      if (/^[a-zA-Z\s\.\-']+$/.test(line)) {
        candidateName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }

  // Fallback 1: Derive from file name (e.g. Priya_Sharma_Resume.pdf -> Priya Sharma)
  if (!candidateName && originalName) {
    let base = originalName.replace(/\.[^/.]+$/, '');
    base = base.replace(/[-_]?(?:resume|cv|curriculum|vitae|202[0-9]|v[0-9]+|final|updated|new)[-_]?/gi, ' ');
    base = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const words = base.split(/\s+/).filter(w => w.length > 1 && !/^\d+$/.test(w));
    if (words.length >= 1 && words.length <= 4) {
      candidateName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Fallback 2: Derive from email username
  if (!candidateName && candidateEmail) {
    const userPart = candidateEmail.split('@')[0];
    const cleaned = userPart.replace(/[._-]/g, ' ').replace(/\d+/g, '').trim();
    if (cleaned.length >= 2) {
      candidateName = cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  if (!candidateName) {
    candidateName = 'Candidate';
  }

  return {
    name: candidateName,
    email: candidateEmail || '',
    phone: candidatePhone || '',
    linkedin: candidateLinkedin || '',
    github: candidateGithub || '',
    portfolio: candidatePortfolio || '',
    hasContact: Boolean(candidateEmail || (candidateName && candidateName !== 'Candidate'))
  };
}

module.exports = { parseResume, extractContactInfo, extractSkills, extractKeywords, detectExperience, extractTitles, SKILLS_DB, ALL_SKILLS };
