const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { parseResume } = require('./lib/resumeParser');
const { searchJobs } = require('./lib/jobSearchEngine');

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer config for file uploads (10MB max, PDF/DOCX/TXT only)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const allowedExts = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
    }
  }
});

const fs = require('fs');

// Create data directory and resumes storage if not present
const DATA_DIR = path.join(__dirname, 'data');
const RESUMES_DIR = path.join(DATA_DIR, 'uploaded_resumes');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

const ALERT_CONFIG_PATH = path.join(DATA_DIR, 'alert_config.json');
const SEEN_JOBS_PATH = path.join(DATA_DIR, 'seen_jobs.json');
const APPLICATIONS_PATH = path.join(DATA_DIR, 'applications.json');

// Helper to load/save Alert Config
function loadAlertConfig() {
  try {
    if (fs.existsSync(ALERT_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(ALERT_CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading alert_config.json:', err.message);
  }
  return {
    enabled: false,
    userEmail: '',
    intervalHours: 8,
    lastRun: null,
    lastCheckNewCount: 0,
    lastRunStatus: null
  };
}

function saveAlertConfig(config) {
  try {
    fs.writeFileSync(ALERT_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving alert_config.json:', err.message);
  }
}

// Helper to load/save Seen Jobs Set
function loadSeenJobIds() {
  try {
    if (fs.existsSync(SEEN_JOBS_PATH)) {
      const arr = JSON.parse(fs.readFileSync(SEEN_JOBS_PATH, 'utf8'));
      return new Set(arr);
    }
  } catch (err) {
    console.error('Error reading seen_jobs.json:', err.message);
  }
  return new Set();
}

function saveSeenJobIds(seenSet) {
  try {
    const arr = Array.from(seenSet);
    fs.writeFileSync(SEEN_JOBS_PATH, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving seen_jobs.json:', err.message);
  }
}

// Helper to load/save Applied Jobs History
function loadApplications() {
  try {
    if (fs.existsSync(APPLICATIONS_PATH)) {
      return JSON.parse(fs.readFileSync(APPLICATIONS_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading applications.json:', err.message);
  }
  return [];
}

function saveApplications(apps) {
  try {
    fs.writeFileSync(APPLICATIONS_PATH, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving applications.json:', err.message);
  }
}

// Helper to retrieve persisted resume from disk or memory
function getLastUploadedResumeFile() {
  if (cache.lastUploadedFile && cache.lastUploadedFile.buffer) {
    return cache.lastUploadedFile;
  }
  try {
    const metaPath = path.join(RESUMES_DIR, 'current_resume_meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const ext = path.extname(meta.filename || '.pdf');
      const filePath = path.join(RESUMES_DIR, 'current_resume' + ext);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        cache.lastUploadedFile = {
          buffer,
          filename: meta.filename,
          mimetype: meta.mimetype
        };
        return cache.lastUploadedFile;
      }
    }
  } catch (err) {
    console.error('Error reading saved resume file:', err.message);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY RESUME BUFFER
// ═══════════════════════════════════════════════════════════════════════════════

const cache = {
  lastParsedResume: null,
  lastUploadedFile: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/parse-resume
 * Upload and parse a resume file
 */
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a PDF, DOCX, or TXT file.'
      });
    }

    console.log(`📄 Parsing resume: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);

    // Store in memory cache
    cache.lastUploadedFile = {
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype
    };

    // Persist resume file to disk storage
    try {
      const ext = path.extname(req.file.originalname) || '.pdf';
      const filePath = path.join(RESUMES_DIR, 'current_resume' + ext);
      const metaPath = path.join(RESUMES_DIR, 'current_resume_meta.json');
      fs.writeFileSync(filePath, req.file.buffer);
      fs.writeFileSync(metaPath, JSON.stringify({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }, null, 2));
    } catch (fsErr) {
      console.error('⚠️ Could not save resume to disk:', fsErr.message);
    }

    const result = await parseResume(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    cache.lastParsedResume = result;

    console.log(`✅ Parsed: ${result.skills.count} skills, ${(result.keywords || []).length} keywords, ${result.titles.length} titles, Experience: ${result.experience.label}`);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('❌ Resume parse error:', err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/search-jobs
 * Search for jobs matching resume data (100% live search, NO cache)
 */
app.post('/api/search-jobs', async (req, res) => {
  try {
    const { skills, titles, experience, keywords, maxDays } = req.body;

    if ((!skills || !skills.all || skills.all.length === 0) && (!keywords || keywords.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'No skills or keywords found. Please upload a resume first.'
      });
    }

    const skillList = skills?.all || [];
    const titleList = titles || [];
    const keywordList = keywords || [];
    const days = maxDays || 30;

    console.log(`🔍 Live job search (${skillList.length} skills, ${keywordList.length} keywords, maxDays: ${days})...`);

    // Cache active search profile for automated 8-hour alert checks
    cache.lastParsedResume = { skills, titles, experience, keywords, maxDays: days };

    // Perform direct, fresh search across all platforms without caching
    const results = await searchJobs({ skills, titles, experience, keywords, maxDays: days });

    res.json({
      success: true,
      data: results,
      cached: false
    });
  } catch (err) {
    console.error('❌ Job search error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search jobs. Please try again.'
    });
  }
});

/**
 * POST /api/generate-cover-letter
 * Generate a well-personalized cover letter using resume data + specific job details
 */
app.post('/api/generate-cover-letter', (req, res) => {
  try {
    const { candidateName, jobTitle, company, skills, experience, matchedSkills, titles } = req.body;
    const name = candidateName || 'Candidate';
    const title = jobTitle || 'Remote Engineer';
    const comp = company || 'your team';

    // Prefer skills that matched this specific job; fallback to all resume skills
    const relevantSkills = (matchedSkills && matchedSkills.length > 0)
      ? matchedSkills.slice(0, 6)
      : (skills || []).slice(0, 6);

    const topSkillsText = relevantSkills.join(', ') || 'modern software development';
    const topSkill1 = relevantSkills[0] || 'software engineering';
    const topSkill2 = relevantSkills[1] || 'system design';
    const topSkill3 = relevantSkills[2] || '';

    const expLevel = (typeof experience === 'object' ? experience?.level : experience) || 'mid';
    const expLabel = (typeof experience === 'object' ? experience?.label : null)
      || (expLevel === 'senior' ? '5+ years' : expLevel === 'entry' ? '1-2 years' : '3-5 years');
    const expPhrase = expLevel === 'senior' || expLevel === 'management'
      ? `${expLabel} of hands-on`
      : expLevel === 'entry'
      ? 'strong foundational experience and'
      : `${expLabel} of solid`;

    const primaryTitle = (titles && titles[0]) || 'Software Engineer';
    const roleIntro = primaryTitle.toLowerCase().includes('senior')
      ? `As a Senior ${topSkill1} specialist`
      : `As a ${primaryTitle}`;

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const coverLetter = `${today}

Dear Hiring Team at ${comp},

I am writing to express my strong interest in the ${title} position at ${comp}. With ${expPhrase} experience in ${topSkillsText}, I am confident I can contribute meaningfully to your team from day one.

${roleIntro}, I have built deep expertise in ${topSkill1}${topSkill2 ? ` and ${topSkill2}` : ''}. I have consistently delivered production-quality work in remote-first, agile environments — and I am excited by the opportunity this role offers.

Key strengths I bring to the ${title} role at ${comp}:
\u2022 Strong proficiency in ${topSkillsText}
\u2022 ${expLevel === 'senior' ? 'Proven ability to architect and own complex systems end-to-end' : 'Solid track record delivering features across the full development lifecycle'}
\u2022 ${topSkill3 ? `Hands-on experience with ${topSkill3}` : 'Excellent problem-solving and debugging skills'}
\u2022 Effective async communication and cross-functional collaboration across time zones

I thrive in autonomous, high-trust remote environments — exactly what ${comp} offers. My resume is attached for your reference, and I would welcome the chance to discuss how my background fits your needs.

Thank you for your consideration.

Best regards,
${name}`;

    res.json({ success: true, coverLetter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/smtp-test
 * Test SMTP connection and configuration
 */
app.post('/api/smtp-test', async (req, res) => {
  try {
    const { smtpConfig } = req.body;
    if (!smtpConfig || !smtpConfig.user || !smtpConfig.pass) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both your email address and 16-character App Password.'
      });
    }

    const host = smtpConfig.host || 'smtp.gmail.com';
    const port = parseInt(smtpConfig.port || '465', 10);
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 587 ? false : (smtpConfig.secure !== false),
      auth: {
        user: smtpConfig.user.trim(),
        pass: smtpConfig.pass.trim()
      }
    });

    await transporter.verify();
    res.json({
      success: true,
      message: `SMTP Connected successfully to ${smtpConfig.user}!`
    });
  } catch (err) {
    console.error('SMTP test error:', err.message);
    res.status(400).json({
      success: false,
      error: `SMTP Connection Failed: ${err.message}. If using Gmail, make sure 2-Step Verification is enabled and you generated a 16-character App Password.`
    });
  }
});

/**
 * POST /api/apply-job
 * Apply on behalf of candidate — sends outbound email with resume attachment to Company HR
 * AND sends a confirmation / application receipt copy to the candidate!
 */
app.post('/api/apply-job', async (req, res) => {
  try {
    const { candidate, job, coverLetter, recipientEmail, smtpConfig, sendCandidateCopy = true } = req.body;

    if (!job || !job.id) {
      return res.status(400).json({ success: false, error: 'Invalid job details' });
    }

    const appId = 'APP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const appliedAt = new Date().toISOString();

    const hrEmail = recipientEmail || job.hrEmail || `careers@${(job.company || 'company').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const candidateName = candidate?.name || 'Applicant';
    const candidateEmail = candidate?.email || 'applicant@example.com';
    const candidatePhone = candidate?.phone || '';
    const candidateLinkedin = candidate?.linkedin || '';
    const subject = `Application for ${job.title} — ${candidateName}`;

    console.log(`\n📧 DISPATCHING EMAIL APPLICATION TO COMPANY HR: ${hrEmail}`);
    console.log(`   From: ${candidateName} <${candidateEmail}>`);
    console.log(`   Job: ${job.title} at ${job.company}`);
    console.log(`   App ID: ${appId}`);

    // Create transporter (User's SMTP or Ethereal Test Account)
    let transporter;
    let isTestAccount = false;
    let senderAddress = `"${candidateName}" <${candidateEmail}>`;

    if (smtpConfig && smtpConfig.user && smtpConfig.pass) {
      // User provided real SMTP (Gmail, Outlook, Custom SMTP)
      transporter = nodemailer.createTransport({
        host: smtpConfig.host || 'smtp.gmail.com',
        port: parseInt(smtpConfig.port || '465', 10),
        secure: smtpConfig.port === 587 ? false : (smtpConfig.secure !== false),
        auth: {
          user: smtpConfig.user.trim(),
          pass: smtpConfig.pass.trim()
        }
      });
      senderAddress = `"${candidateName}" <${smtpConfig.user.trim()}>`;
    } else {
      // Auto-create Ethereal test account for real MIME email verification
      const testAccount = await nodemailer.createTestAccount();
      isTestAccount = true;
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      senderAddress = `"${candidateName} (via Fleximo)" <${testAccount.user}>`;
    }

    // Attach uploaded resume if available in disk cache or memory cache
    const attachments = [];
    let resumeFileName = 'Resume.pdf';
    const savedResumeFile = getLastUploadedResumeFile();
    if (savedResumeFile && savedResumeFile.buffer) {
      resumeFileName = savedResumeFile.filename || 'Resume.pdf';
      attachments.push({
        filename: resumeFileName,
        content: savedResumeFile.buffer,
        contentType: savedResumeFile.mimetype || 'application/pdf'
      });
    }

    // 1. Send Application Email to Company HR
    const companyMailOptions = {
      from: senderAddress,
      to: hrEmail,
      replyTo: candidateEmail,
      subject: subject,
      text: coverLetter,
      attachments: attachments
    };

    const companyInfo = await transporter.sendMail(companyMailOptions);
    console.log(`✅ COMPANY APPLICATION DISPATCHED! MessageID: ${companyInfo.messageId}`);

    let companyPreviewUrl = null;
    if (isTestAccount) {
      companyPreviewUrl = nodemailer.getTestMessageUrl(companyInfo);
      console.log(`🔗 Preview Company Email: ${companyPreviewUrl}`);
    }

    // 2. Send Confirmation / Receipt Email to Applicant
    let candidateInfo = null;
    let candidatePreviewUrl = null;
    let candidateSent = false;

    if (sendCandidateCopy && candidateEmail && candidateEmail !== 'applicant@example.com') {
      try {
        console.log(`📬 DISPATCHING APPLICANT CONFIRMATION COPY TO: ${candidateEmail}`);

        const confirmationHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0f172a; color:#f8fafc; padding:28px; border-radius:12px; max-width:650px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:20px;">
              <div style="font-size:2.8rem; margin-bottom:8px;">🚀</div>
              <h2 style="color:#10b981; margin:0 0 6px 0; font-size:1.5rem;">Job Application Dispatched!</h2>
              <p style="color:#94a3b8; font-size:0.95rem; margin:0;">An outbound application email was submitted on your behalf to the hiring team.</p>
            </div>

            <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:18px; margin-bottom:16px;">
              <h3 style="margin:0 0 6px 0; color:#38bdf8; font-size:1.2rem;">${job.title}</h3>
              <p style="margin:0 0 10px 0; color:#cbd5e1; font-weight:600; font-size:0.95rem;">🏢 ${job.company} &nbsp;•&nbsp; 📍 ${job.location || 'Remote'}</p>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <span style="background:rgba(16,185,129,0.2); color:#34d399; padding:4px 10px; border-radius:6px; font-size:0.85rem; font-weight:bold;">
                  🎯 ${job.matchScore || 90}% Match
                </span>
                <span style="background:rgba(99,102,241,0.2); color:#a5b4fc; padding:4px 10px; border-radius:6px; font-size:0.85rem;">
                  Ref: ${appId}
                </span>
              </div>
            </div>

            <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:18px; margin-bottom:16px;">
              <h4 style="margin:0 0 12px 0; color:#cbd5e1; font-size:0.95rem; border-bottom:1px solid #334155; padding-bottom:8px;">📋 Delivery &amp; Contact Details</h4>
              <table style="width:100%; border-collapse:collapse; font-size:0.9rem; color:#cbd5e1; line-height:1.8;">
                <tr><td style="color:#94a3b8; width:160px;">Company HR Sent To:</td><td style="font-weight:600; color:#38bdf8;">${hrEmail}</td></tr>
                <tr><td style="color:#94a3b8;">Applicant Name:</td><td>${candidateName}</td></tr>
                <tr><td style="color:#94a3b8;">Applicant Reply-To:</td><td>${candidateEmail}</td></tr>
                ${candidatePhone ? `<tr><td style="color:#94a3b8;">Phone:</td><td>${candidatePhone}</td></tr>` : ''}
                ${candidateLinkedin ? `<tr><td style="color:#94a3b8;">LinkedIn:</td><td><a href="${candidateLinkedin}" style="color:#38bdf8; text-decoration:none;">${candidateLinkedin}</a></td></tr>` : ''}
                <tr><td style="color:#94a3b8;">Resume Attachment:</td><td style="color:#10b981;">✅ ${resumeFileName} (${attachments.length > 0 ? 'Attached' : 'Profile Text'})</td></tr>
                <tr><td style="color:#94a3b8;">Dispatched Timestamp:</td><td>${new Date().toLocaleString()}</td></tr>
              </table>
            </div>

            <div style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:18px; margin-bottom:16px;">
              <h4 style="margin:0 0 10px 0; color:#cbd5e1; font-size:0.95rem;">✉️ Sent Cover Letter Copy</h4>
              <div style="background:#0f172a; border:1px solid #334155; border-radius:6px; padding:14px; font-family:monospace; font-size:0.82rem; line-height:1.6; color:#94a3b8; white-space:pre-wrap;">${coverLetter}</div>
            </div>

            <div style="text-align:center; margin-top:20px;">
              <a href="${job.url}" target="_blank" style="background:#6366f1; color:#ffffff; text-decoration:none; padding:10px 20px; border-radius:8px; font-weight:bold; font-size:0.9rem; display:inline-block;">
                View Original Job Posting ↗
              </a>
            </div>

            <div style="margin-top:24px; padding-top:16px; border-top:1px solid #334155; text-align:center; color:#64748b; font-size:0.8rem;">
              Fleximo • Automated Application Tracker • ${appId}
            </div>
          </div>
        `;

        const candidateMailOptions = {
          from: `"Fleximo" <${smtpConfig?.user || (isTestAccount ? 'noreply@ethereal.email' : candidateEmail)}>`,
          to: candidateEmail,
          subject: `✅ Application Confirmation: ${job.title} at ${job.company}`,
          html: confirmationHtml,
          text: `Application Confirmation\n\nJob: ${job.title} at ${job.company}\nRef: ${appId}\nSent to HR: ${hrEmail}\nResume Attached: ${resumeFileName}\n\nCover Letter:\n${coverLetter}`
        };

        candidateInfo = await transporter.sendMail(candidateMailOptions);
        candidateSent = true;
        console.log(`✅ APPLICANT CONFIRMATION DISPATCHED! MessageID: ${candidateInfo.messageId}`);

        if (isTestAccount) {
          candidatePreviewUrl = nodemailer.getTestMessageUrl(candidateInfo);
          console.log(`🔗 Preview Candidate Confirmation Email: ${candidatePreviewUrl}`);
        }
      } catch (candErr) {
        console.error('⚠️ Could not send candidate confirmation email:', candErr.message);
      }
    }

    // 3. Save to applications database
    const applicationRecord = {
      applicationId: appId,
      appliedAt,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo || null,
        location: job.location || 'Remote',
        url: job.url,
        matchScore: job.matchScore,
        source: job.source,
        regionInfo: job.regionInfo || null
      },
      candidate: {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        linkedin: candidateLinkedin
      },
      recipientEmail: hrEmail,
      companyResult: {
        messageId: companyInfo.messageId,
        previewUrl: companyPreviewUrl,
        delivered: true
      },
      candidateResult: {
        sent: candidateSent,
        messageId: candidateInfo?.messageId || null,
        previewUrl: candidatePreviewUrl
      },
      hasResumeAttachment: attachments.length > 0,
      resumeFilename: resumeFileName,
      coverLetter: coverLetter,
      isTestAccount: isTestAccount
    };

    const savedApps = loadApplications();
    savedApps.unshift(applicationRecord);
    saveApplications(savedApps);

    res.json({
      success: true,
      applicationId: appId,
      appliedAt,
      messageId: companyInfo.messageId,
      previewUrl: companyPreviewUrl,
      candidatePreviewUrl: candidatePreviewUrl,
      candidateConfirmationSent: candidateSent,
      isTestAccount: isTestAccount,
      message: `Email application with resume attachment sent to ${hrEmail}${candidateSent ? ` and confirmation copy sent to ${candidateEmail}` : ''}!`,
      details: {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        recipientEmail: hrEmail,
        candidateName: candidateName,
        candidateEmail: candidateEmail,
        hasResumeAttachment: attachments.length > 0,
        resumeFilename: resumeFileName
      },
      applicationRecord
    });
  } catch (err) {
    console.error('❌ Email dispatch error:', err.message);
    res.status(500).json({ success: false, error: 'Email dispatch failed: ' + err.message });
  }
});

/**
 * GET /api/applications
 * Retrieve history of all sent job applications
 */
app.get('/api/applications', (req, res) => {
  try {
    const apps = loadApplications();
    res.json({ success: true, applications: apps, count: apps.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/applications/:id
 * Delete an application record from history
 */
app.delete('/api/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    let apps = loadApplications();
    const initialCount = apps.length;
    apps = apps.filter(a => a.applicationId !== id);
    saveApplications(apps);
    res.json({ success: true, deleted: initialCount > apps.length, count: apps.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATED JOB ALERT & EMAIL NOTIFIER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute automated job alert check, deduplicate seen jobs, and email digest
 */
async function runJobAlertCheck(isManual = false) {
  const config = loadAlertConfig();
  if (!isManual && !config.enabled) {
    return { success: false, reason: 'Alerts disabled in configuration' };
  }

  const notificationEmail = config.userEmail || 'candidate@example.com';
  const intervalHours = config.intervalHours || 8;
  const minMatch = parseInt(config.minMatch || '0', 10);
  const regionScope = config.regionScope || 'all';

  console.log(`\n⏰ RUNNING ${isManual ? 'MANUAL' : `AUTOMATED ${intervalHours}-HOUR`} JOB ALERT CHECK...`);
  console.log(`   Recipient: ${notificationEmail} | MinMatch: ${minMatch}% | Region: ${regionScope}`);

  try {
    // Use the active uploaded/searched profile if available
    const resumeData = cache.lastParsedResume || {
      skills: { all: ['Software', 'Engineer', 'Developer', 'Frontend', 'Backend'] },
      titles: ['Software Engineer', 'Full Stack Developer'],
      keywords: ['developer', 'engineer', 'software'],
      experience: { level: 'mid', label: 'Mid Level' },
      maxDays: 30
    };

    const searchResults = await searchJobs(resumeData);
    let allMatched = [...(searchResults.worldwide || []), ...(searchResults.india || []), ...(searchResults.global || [])];

    // Remove duplicates across categories
    const uniqueFetchedJobs = [];
    const fetchedIds = new Set();
    for (const job of allMatched) {
      if (!fetchedIds.has(job.id)) {
        fetchedIds.add(job.id);
        uniqueFetchedJobs.push(job);
      }
    }

    // Apply Region Scope filter if configured
    let filteredJobs = uniqueFetchedJobs;
    if (regionScope === 'worldwide') {
      filteredJobs = filteredJobs.filter(j => j.regionInfo?.isWorldwide || j.remoteType === 'worldwide');
    } else if (regionScope === 'india') {
      filteredJobs = filteredJobs.filter(j => j.regionInfo?.indiaEligible);
    }

    // Apply Min Match Score filter if configured
    if (minMatch > 0) {
      filteredJobs = filteredJobs.filter(j => (j.matchScore || 0) >= minMatch);
    }

    // Load seen jobs Set
    const seenJobIds = loadSeenJobIds();

    // Filter down to ONLY NEW UNSEEN JOBS
    const newJobs = filteredJobs.filter(job => !seenJobIds.has(job.id));

    console.log(`📊 Alert Check Results: ${uniqueFetchedJobs.length} total matched, ${filteredJobs.length} passed alert filters, ${newJobs.length} NEW unseen jobs!`);

    let emailSent = false;
    let previewUrl = null;
    let messageId = null;

    if (newJobs.length > 0) {
      // Build High-Quality HTML Email Digest
      const topJobs = newJobs.slice(0, 15);
      const jobsHtml = topJobs.map(j => `
        <div style="background:#1e293b; color:#f8fafc; border-radius:10px; padding:18px; margin-bottom:14px; border:1px solid #334155; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
            <div>
              <h3 style="margin:0 0 4px 0; font-size:1.15rem; line-height:1.3;">
                <a href="${j.url}" target="_blank" style="color:#38bdf8; text-decoration:none; font-weight:700;">${j.title} ↗</a>
              </h3>
              <p style="margin:0; font-weight:600; color:#cbd5e1; font-size:0.95rem;">🏢 ${j.company} &nbsp;•&nbsp; 📍 ${j.location || 'Remote'}</p>
            </div>
            <span style="background:#6366f1; color:#ffffff; padding:4px 10px; border-radius:12px; font-weight:bold; font-size:0.85rem;">
              ${j.matchScore}% Match
            </span>
          </div>
          <div style="margin-bottom:10px;">
            ${j.regionInfo?.isWorldwide ? `<span style="display:inline-block; padding:2px 8px; background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399; border-radius:4px; font-size:0.75rem; font-weight:600; margin-right:6px;">🌐 100% Worldwide</span>` : ''}
            ${j.regionInfo?.indiaEligible ? `<span style="display:inline-block; padding:2px 8px; background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#fbbf24; border-radius:4px; font-size:0.75rem; font-weight:600; margin-right:6px;">🇮🇳 India Remote</span>` : ''}
            <span style="display:inline-block; padding:2px 8px; background:rgba(255,255,255,0.08); color:#94a3b8; border-radius:4px; font-size:0.75rem;">Source: ${j.source}</span>
          </div>
          <p style="margin:0 0 12px 0; font-size:0.88rem; color:#94a3b8; line-height:1.5;">${(j.description || '').substring(0, 220)}...</p>
          <div>
            <a href="${j.url}" target="_blank" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:8px 16px; border-radius:6px; font-size:0.85rem; font-weight:bold;">View &amp; Apply Directly ↗</a>
          </div>
        </div>
      `).join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0; padding:20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#0b0f19; color:#f8fafc;">
          <div style="max-width:650px; margin:0 auto; background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:28px; box-shadow:0 10px 25px rgba(0,0,0,0.3);">
            <div style="border-bottom:1px solid #334155; padding-bottom:16px; margin-bottom:20px;">
              <h1 style="margin:0 0 6px 0; font-size:1.4rem; color:#38bdf8; display:flex; align-items:center; gap:8px;">
                🚀 Remote Job Alert Digest
              </h1>
              <p style="margin:0; color:#94a3b8; font-size:0.95rem;">
                Found <strong>${newJobs.length} NEW remote jobs</strong> matching your profile across 9 major remote platforms!
              </p>
            </div>
            ${jobsHtml}
            ${newJobs.length > 15 ? `<div style="text-align:center; padding:16px 0; color:#94a3b8; font-size:0.9rem;">+ ${newJobs.length - 15} more new jobs found. Visit your live agent dashboard at <a href="http://localhost:5050" style="color:#38bdf8; font-weight:bold;">http://localhost:5050</a></div>` : ''}
            <div style="margin-top:24px; padding-top:20px; border-top:1px solid #334155; text-align:center; color:#64748b; font-size:0.8rem; line-height:1.5;">
              Fleximo Job Alert • Frequency: Every ${intervalHours} Hours<br>
              Managing your alerts? Open <a href="http://localhost:5050" style="color:#818cf8;">http://localhost:5050</a> to pause or change settings.
            </div>
          </div>
        </body>
        </html>
      `;

      // Dispatch Outbound Email
      let transporter;
      let isTestAccount = false;
      let fromAddress = `"Fleximo Alert" <${notificationEmail}>`;

      if (config.smtpConfig && config.smtpConfig.user && config.smtpConfig.pass) {
        try {
          const isGmail = (config.smtpConfig.host || '').includes('gmail');
          transporter = nodemailer.createTransport({
            host: config.smtpConfig.host || 'smtp.gmail.com',
            port: parseInt(config.smtpConfig.port || '465', 10),
            secure: parseInt(config.smtpConfig.port || '465', 10) === 465,
            auth: {
              user: config.smtpConfig.user,
              pass: config.smtpConfig.pass
            }
          });
          fromAddress = `"Fleximo Alert" <${config.smtpConfig.user}>`;
          console.log(`📧 Dispatching via Custom SMTP (${config.smtpConfig.host || 'smtp.gmail.com'}) to ${notificationEmail}`);
        } catch (smtpErr) {
          console.log(`⚠️ SMTP init error: ${smtpErr.message}. Falling back to Ethereal sandbox.`);
        }
      }

      if (!transporter) {
        const testAccount = await nodemailer.createTestAccount();
        isTestAccount = true;
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        fromAddress = `"Fleximo Alert" <${testAccount.user}>`;
        console.log(`🧪 Real SMTP not configured — using Sandbox Ethereal Test Account`);
      }

      let info;
      try {
        info = await transporter.sendMail({
          from: fromAddress,
          to: notificationEmail,
          subject: `⏰ [Remote Job Alert] ${newJobs.length} New Matching Roles Found!`,
          html: emailHtml
        });
      } catch (sendErr) {
        console.log(`⚠️ SMTP send error: ${sendErr.message}. Falling back to Ethereal Sandbox dispatch.`);
        const testAccount = await nodemailer.createTestAccount();
        isTestAccount = true;
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        info = await transporter.sendMail({
          from: `"Fleximo Alert" <${testAccount.user}>`,
          to: notificationEmail,
          subject: `⏰ [Remote Job Alert] ${newJobs.length} New Matching Roles Found!`,
          html: emailHtml
        });
      }

      emailSent = true;
      messageId = info.messageId;
      if (isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      console.log(`✅ ALERT EMAIL SENT! MessageID: ${messageId}`);
      if (previewUrl) {
        console.log(`🔗 Preview Alert Digest Email: ${previewUrl}`);
      }

      // Mark newly emailed jobs as SEEN in seen_jobs database
      for (const job of newJobs) {
        seenJobIds.add(job.id);
      }
      saveSeenJobIds(seenJobIds);
    } else {
      console.log(`ℹ️ No new unseen jobs found matching filters. Skipping email dispatch.`);
    }

    // Update Alert Config Status
    config.lastRun = new Date().toISOString();
    config.lastCheckNewCount = newJobs.length;
    config.lastRunStatus = `Checked successfully. ${newJobs.length} new jobs found.`;
    saveAlertConfig(config);

    return {
      success: true,
      newCount: newJobs.length,
      totalFetched: uniqueFetchedJobs.length,
      emailSent,
      previewUrl,
      messageId,
      lastRun: config.lastRun,
      seenCount: seenJobIds.size
    };
  } catch (err) {
    console.error('❌ Job alert check error:', err.message);
    config.lastRun = new Date().toISOString();
    config.lastRunStatus = `Error: ${err.message}`;
    saveAlertConfig(config);
    return { success: false, error: err.message };
  }
}

// REST Endpoints for Automated Alerts
app.get('/api/alerts/config', (req, res) => {
  const config = loadAlertConfig();
  const seenJobIds = loadSeenJobIds();
  res.json({
    success: true,
    config,
    seenCount: seenJobIds.size
  });
});

app.post('/api/alerts/config', (req, res) => {
  try {
    const { enabled, userEmail, intervalHours, regionScope, minMatch, smtpConfig } = req.body;
    const config = loadAlertConfig();

    if (enabled !== undefined) config.enabled = Boolean(enabled);
    if (userEmail !== undefined) config.userEmail = String(userEmail).trim();
    if (intervalHours !== undefined) config.intervalHours = parseInt(intervalHours, 10) || 8;
    if (regionScope !== undefined) config.regionScope = String(regionScope);
    if (minMatch !== undefined) config.minMatch = parseInt(minMatch, 10) || 0;

    if (smtpConfig) {
      config.smtpConfig = {
        host: smtpConfig.host || 'smtp.gmail.com',
        port: parseInt(smtpConfig.port || '465', 10),
        user: String(smtpConfig.user || '').trim(),
        pass: String(smtpConfig.pass || '').trim()
      };
    }

    saveAlertConfig(config);
    scheduleAlertCron();

    res.json({
      success: true,
      message: `Alert settings saved! Background monitor is ${config.enabled ? `ACTIVE 🟢 (Every ${config.intervalHours || 8} Hours)` : 'PAUSED ⚪'}`,
      config
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/alerts/trigger-check', async (req, res) => {
  try {
    const result = await runJobAlertCheck(true);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/alerts/test-email', async (req, res) => {
  try {
    const { userEmail, smtpConfig } = req.body;
    const recipient = (userEmail || '').trim() || loadAlertConfig().userEmail;

    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Please enter a delivery email address.' });
    }

    const testHtml = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0f172a; color:#f8fafc; padding:28px; border-radius:12px; max-width:600px; margin:0 auto; border:1px solid #1e293b;">
        <h2 style="color:#10b981; margin-top:0;">✅ Test Job Alert Digest</h2>
        <p style="color:#cbd5e1; font-size:1rem; line-height:1.5;">
          Your automated remote job alert is <strong>properly configured and working!</strong>
        </p>
        <div style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:16px; margin:16px 0;">
          <h3 style="margin:0 0 6px 0; color:#38bdf8; font-size:1.1rem;">Senior Full-Stack Engineer (Sample Match)</h3>
          <p style="margin:0; color:#94a3b8; font-size:0.9rem;">🏢 Tech Global • 📍 100% Worldwide Remote • <strong style="color:#6366f1;">95% Match</strong></p>
        </div>
        <p style="color:#94a3b8; font-size:0.85rem;">
          You will automatically receive alerts whenever new matching roles are discovered across 9 remote platforms.
        </p>
      </div>
    `;

    let transporter;
    let isTestAccount = false;
    let fromAddress = `"Fleximo Alert" <${recipient}>`;

    const effectiveSmtp = smtpConfig || loadAlertConfig().smtpConfig;

    if (effectiveSmtp && effectiveSmtp.user && effectiveSmtp.pass) {
      try {
        transporter = nodemailer.createTransport({
          host: effectiveSmtp.host || 'smtp.gmail.com',
          port: parseInt(effectiveSmtp.port || '465', 10),
          secure: parseInt(effectiveSmtp.port || '465', 10) === 465,
          auth: { user: effectiveSmtp.user, pass: effectiveSmtp.pass }
        });
        fromAddress = `"Fleximo Alert" <${effectiveSmtp.user}>`;
      } catch (err) {
        console.warn('Test email SMTP transport error:', err.message);
      }
    }

    if (!transporter) {
      const testAccount = await nodemailer.createTestAccount();
      isTestAccount = true;
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      fromAddress = `"Fleximo Alert" <${testAccount.user}>`;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: '✅ [Test] Remote Job Alert Email Delivery Verified',
      html: testHtml
    });

    const previewUrl = isTestAccount ? nodemailer.getTestMessageUrl(info) : null;

    res.json({
      success: true,
      message: `Test email sent successfully to ${recipient}!`,
      messageId: info.messageId,
      previewUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/alerts/reset-seen', (req, res) => {
  saveSeenJobIds(new Set());
  res.json({ success: true, message: 'Seen jobs history reset! Next alert check will scan all matched jobs as new.' });
});

// Dynamic Interval Scheduler
let alertIntervalTimer = null;
function scheduleAlertCron() {
  if (alertIntervalTimer) clearInterval(alertIntervalTimer);
  const config = loadAlertConfig();
  const hours = parseInt(config.intervalHours || '8', 10);
  const ms = Math.max(1, hours) * 60 * 60 * 1000;
  console.log(`⏰ Scheduled automated job alert check every ${hours} hours (${ms}ms)`);
  alertIntervalTimer = setInterval(() => {
    console.log(`\n⏰ Scheduled ${hours}-Hour Interval Triggered!`);
    runJobAlertCheck(false);
  }, ms);
}
scheduleAlertCron();

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════

app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'fleximo'
  });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║          🚀 Fleximo — Remote Job Finder                      ║
║          Running at http://localhost:${PORT}                ║
║                                                          ║
║  Upload your resume → Get matched remote jobs            ║
║  India Remote 🇮🇳  |  Global Remote 🌍                    ║
╚══════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Closing HTTP server gracefully...`);
    if (server) {
      server.close(() => {
        console.log('Fleximo HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
