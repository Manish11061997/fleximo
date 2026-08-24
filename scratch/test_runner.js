const http = require('http');
const fs = require('fs');
const path = require('path');

const { parseResume, extractSkills, detectExperience, extractTitles } = require('../lib/resumeParser');
const { 
  calculateMatchScore, 
  classifyJobRegion, 
  isFullyRemoteJob, 
  isAustraliaNZ,
  searchJobs 
} = require('../lib/jobSearchEngine');

// QA Test Suite Results Data Structure
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: []
};

function logSuite(suiteName) {
  console.log(`\n==================================================`);
  console.log(`🧪 SUITE: ${suiteName}`);
  console.log(`==================================================`);
  testResults.suites.push({ name: suiteName, tests: [] });
}

function assert(condition, description, detail = '') {
  testResults.total++;
  const currentSuite = testResults.suites[testResults.suites.length - 1];
  if (condition) {
    testResults.passed++;
    console.log(`  ✅ PASS: ${description}`);
    currentSuite.tests.push({ description, status: 'PASS', detail });
  } else {
    testResults.failed++;
    console.log(`  ❌ FAIL: ${description} ${detail ? '(' + detail + ')' : ''}`);
    currentSuite.tests.push({ description, status: 'FAIL', detail });
  }
}

// Helper HTTP POST/GET request runner
function makeRequest(method, urlPath, body = null, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5050,
      path: urlPath,
      method: method,
      headers: {}
    };

    let postData = '';
    if (body && !isMultipart) {
      postData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runAllQATests() {
  console.log(`🚀 STARTING SENIOR QA AUTOMATED SUITE FOR REMOTE JOB AGENT`);
  console.log(`Time: ${new Date().toISOString()}`);

  // ---------------------------------------------------------------------------
  // 1. UNIT & DOMAIN LOGIC TESTING: RESUME PARSER
  // ---------------------------------------------------------------------------
  logSuite('Resume Parser Engine');

  const sampleSalesforceResume = `
    Senior Salesforce Developer with 6 years of experience.
    Proficient in Apex, Lightning Web Components (LWC), Visualforce, SOQL, Sales Cloud, Service Cloud.
    Led end-to-end implementation of Experience Cloud portal and REST API integrations.
  `;

  const parsedSkills = extractSkills(sampleSalesforceResume);
  const skillListLower = parsedSkills.all.map(s => s.toLowerCase());
  assert(
    skillListLower.includes('salesforce') && skillListLower.includes('apex') && skillListLower.includes('lwc'),
    'Resume parser extracts Salesforce skills (Salesforce, Apex, LWC)',
    `Found: ${parsedSkills.all.join(', ')}`
  );

  const expLevel = detectExperience(sampleSalesforceResume);
  assert(
    expLevel.yearsDetected === 6 && expLevel.level === 'senior',
    'Experience level correctly parsed as Senior with 6 years',
    `Parsed: years=${expLevel.yearsDetected}, level=${expLevel.level}`
  );

  const titles = extractTitles(sampleSalesforceResume);
  assert(
    titles.some(t => t.toLowerCase().includes('salesforce developer')),
    'Title extraction identifies Salesforce Developer role',
    `Titles: ${titles.join(', ')}`
  );

  // Edge case: empty resume
  const emptyParse = extractSkills('');
  assert(
    emptyParse.all.length === 0,
    'Empty resume input yields 0 extracted skills cleanly without error'
  );

  // ---------------------------------------------------------------------------
  // 2. UNIT & RELEVANCE LOGIC: JOB SEARCH ENGINE & FILTERING
  // ---------------------------------------------------------------------------
  logSuite('Job Search Engine & Relevance Filter');

  // Test Fully Remote Filter
  const fullyRemoteJob = { title: 'Salesforce Developer', location: '100% Remote', description: 'Fully remote position worldwide' };
  const hybridJob = { title: 'Salesforce Architect', location: 'Hybrid - New York', description: '2 days in office required per week' };
  const onsiteJob = { title: 'Senior Salesforce Admin', location: 'Onsite - Sydney', description: 'Onsite work at headquarters' };

  assert(isFullyRemoteJob(fullyRemoteJob) === true, '100% Fully Remote job accepted by remote purity filter');
  assert(isFullyRemoteJob(hybridJob) === false, 'Hybrid job rejected by remote purity filter');
  assert(isFullyRemoteJob(onsiteJob) === false, 'Onsite job rejected by remote purity filter');

  // Test AU/NZ Regional Classifier
  const auJob = { location: 'Sydney, Australia', description: 'Remote in Australia' };
  const nzJob = { location: 'Auckland, New Zealand', description: 'NZ Remote' };
  const usJob = { location: 'Austin, TX', description: 'US Only' };

  assert(isAustraliaNZ(auJob) === true, 'Australia remote role correctly tagged as AU/NZ');
  assert(isAustraliaNZ(nzJob) === true, 'New Zealand remote role correctly tagged as AU/NZ');
  assert(isAustraliaNZ(usJob) === false, 'US remote role correctly excluded from AU/NZ');

  // Test Strict Relevance Gating (Rejection of non-Salesforce roles)
  const sfJob = {
    title: 'Senior Salesforce Developer',
    tags: ['Salesforce', 'Apex'],
    description: 'We are seeking a Senior Salesforce Developer to build Apex and LWC solutions.'
  };

  const unrelatedJob = {
    title: 'Director Proposal Management Defense and Space',
    tags: ['management', 'proposals'],
    description: 'Lead proposal operations. Preferred: Experience with Salesforce.com CRM.'
  };

  const sfScore = calculateMatchScore(sfJob, ['salesforce', 'apex', 'lwc'], ['salesforce developer'], 'Senior', ['salesforce']);
  const unrelatedScore = calculateMatchScore(unrelatedJob, ['salesforce', 'apex', 'lwc'], ['salesforce developer'], 'Senior', ['salesforce']);

  assert(
    sfScore.score >= 80,
    'Valid Salesforce Developer job receives high match score (>=80)',
    `Score: ${sfScore.score}`
  );

  assert(
    unrelatedScore.score === 0,
    'Unrelated job mentioning Salesforce only in description body is STRICTLY REJECTED (score = 0)',
    `Score: ${unrelatedScore.score}`
  );

  // ---------------------------------------------------------------------------
  // 3. API ENDPOINT & CONTRACT TESTING
  // ---------------------------------------------------------------------------
  logSuite('REST API Endpoints & Contracts');

  // Test GET /api/alerts/config
  const alertConfigRes = await makeRequest('GET', '/api/alerts/config');
  assert(
    alertConfigRes.status === 200 && alertConfigRes.body && alertConfigRes.body.success === true,
    'GET /api/alerts/config returns HTTP 200 with success status',
    `Status: ${alertConfigRes.status}`
  );
  assert(
    typeof alertConfigRes.body.config.enabled === 'boolean' && alertConfigRes.body.config.userEmail === 'rvk8297@gmail.com',
    'Alert config contains correct target email (rvk8297@gmail.com) and boolean enabled status'
  );

  // Test POST /api/alerts/config
  const updateAlertRes = await makeRequest('POST', '/api/alerts/config', {
    enabled: true,
    userEmail: 'rvk8297@gmail.com',
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 465,
      user: 'rvk8297@gmail.com',
      pass: 'testpass1234'
    }
  });

  assert(
    updateAlertRes.status === 200 && updateAlertRes.body.success === true,
    'POST /api/alerts/config updates settings and SMTP config successfully'
  );

  // Test POST /api/alerts/reset-seen
  const resetSeenRes = await makeRequest('POST', '/api/alerts/reset-seen');
  assert(
    resetSeenRes.status === 200 && resetSeenRes.body.success === true,
    'POST /api/alerts/reset-seen clears seen jobs history'
  );

  // Verify seenCount is 0
  const checkClearedConfig = await makeRequest('GET', '/api/alerts/config');
  assert(
    checkClearedConfig.body.seenCount === 0,
    'Seen jobs database verified to be 0 after reset'
  );

  // Test POST /api/search-jobs with empty payload (Input Validation Security)
  const emptySearchRes = await makeRequest('POST', '/api/search-jobs', {});
  assert(
    emptySearchRes.status === 400 && emptySearchRes.body && emptySearchRes.body.success === false,
    'POST /api/search-jobs validates inputs and rejects empty payload with HTTP 400'
  );

  // Test POST /api/search-jobs with Salesforce parameters
  const sfSearchRes = await makeRequest('POST', '/api/search-jobs', {
    keywords: ['Salesforce', 'Apex', 'LWC'],
    skills: { all: ['Salesforce', 'Apex', 'LWC'] },
    titles: ['Salesforce Developer', 'Senior Salesforce Developer'],
    maxDays: 30
  });

  assert(
    sfSearchRes.status === 200 && sfSearchRes.body && sfSearchRes.body.success === true,
    'POST /api/search-jobs executes live search across 7 platforms successfully'
  );

  const matchedJobs = sfSearchRes.body.data?.global || [];
  assert(
    matchedJobs.length > 0,
    `Salesforce search returned ${matchedJobs.length} active matched jobs`,
    `Count: ${matchedJobs.length}`
  );

  // Verify 100% of returned job titles contain Salesforce or core components
  const nonSalesforceTitles = matchedJobs.filter(j => !/(salesforce|apex|lwc|visualforce|force\.com)/i.test(j.title + ' ' + (j.tags || []).join(' ')));
  assert(
    nonSalesforceTitles.length === 0,
    '100% of returned job titles strictly match Salesforce ecosystem (Zero false positives)',
    nonSalesforceTitles.length > 0 ? `Unmatched: ${nonSalesforceTitles.map(j => j.title).join('; ')}` : 'Zero false positives'
  );

  // ---------------------------------------------------------------------------
  // 4. PERFORMANCE & EDGE CASE TESTING
  // ---------------------------------------------------------------------------
  logSuite('Performance, Latency & Edge Cases');

  const startTime = Date.now();
  const triggerAlertRes = await makeRequest('POST', '/api/alerts/trigger-check');
  const durationMs = Date.now() - startTime;

  assert(
    triggerAlertRes.status === 200 && triggerAlertRes.body.success === true,
    'POST /api/alerts/trigger-check runs automated 8-hour alert check successfully'
  );

  assert(
    durationMs < 10000,
    `Multi-platform job search & alert check completes in under 10 seconds (${durationMs}ms)`,
    `Duration: ${durationMs}ms`
  );

  assert(
    triggerAlertRes.body.emailSent === true,
    'Alert check generates & sends Nodemailer email digest successfully'
  );

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT GENERATION
  // ---------------------------------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`📊 SENIOR QA VERIFICATION SUMMARY REPORT`);
  console.log(`==================================================`);
  console.log(`Total Tests Executed : ${testResults.total}`);
  console.log(`Passed               : ${testResults.passed} ✅`);
  console.log(`Failed               : ${testResults.failed} ❌`);
  console.log(`Pass Rate            : ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  fs.writeFileSync('./scratch/qa_test_report.json', JSON.stringify(testResults, null, 2));
  console.log(`Report JSON saved to ./scratch/qa_test_report.json`);
}

runAllQATests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
