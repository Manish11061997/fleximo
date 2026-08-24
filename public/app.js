// ═══════════════════════════════════════════════════════════════════════════════
// REMOTE JOB AGENT — Frontend Application
// ═══════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    resumeData: null,
    results: null,
    activeTab: 'worldwide',
    sortBy: 'match',
    minMatch: 0,
    remoteType: 'all',        // 'all' | 'worldwide' | 'country_restricted'
    countryScope: 'all',      // 'all' | 'worldwide' | 'india' | 'us' | 'europe' | 'apac' | 'latam'
    searchQuery: '',
    appliedJobs: JSON.parse(localStorage.getItem('remote_job_agent_applied') || '[]'),
    candidateProfile: {},
    targetJobForApply: null
  };


  // ─── DOM References ───────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    // Upload
    uploadArea: $('#upload-area'),
    fileInput: $('#file-input'),
    uploadSection: $('#upload-section'),
    uploadProgress: $('#upload-progress'),
    progressFilename: $('#progress-filename'),
    progressStatus: $('#progress-status'),
    directKeywordInput: $('#direct-keyword-input'),
    directKeywordBtn: $('#direct-keyword-btn'),

    // Resume
    resumeSection: $('#resume-section'),
    resumeFilename: $('#resume-filename'),
    resumeExperience: $('#resume-experience'),
    resumeSkillsCount: $('#resume-skills-count'),
    resumeTitlesCount: $('#resume-titles-count'),
    changeResumeBtn: $('#change-resume-btn'),

    // Searching Modal
    searchingModalOverlay: $('#searching-modal-overlay'),
    searchingTitle: $('#searching-title'),
    searchingStatus: $('#searching-status'),

    // Results
    resultsSection: $('#results-section'),
    tabWorldwide: $('#tab-worldwide'),
    tabIndia: $('#tab-india'),
    tabGlobal: $('#tab-global'),
    tabApplied: $('#tab-applied'),
    tabWorldwideCount: $('#tab-worldwide-count'),
    tabIndiaCount: $('#tab-india-count'),
    tabGlobalCount: $('#tab-global-count'),
    tabAppliedCount: $('#tab-applied-count'),
    tabIndicator: $('#tab-indicator'),
    jobListWorldwide: $('#job-list-worldwide'),
    jobListIndia: $('#job-list-india'),
    jobListGlobal: $('#job-list-global'),
    jobListApplied: $('#job-list-applied'),
    emptyState: $('#empty-state'),
    sortSelect: $('#sort-select'),
    minMatchSelect: $('#min-match'),
    remoteTypeSelect: $('#remote-type-filter'),
    countryScopeSelect: $('#country-scope-filter'),
    dateRangeSelect: $('#date-range-select'),
    modalSortSelect: $('#modal-sort-select'),
    modalMinMatchSelect: $('#modal-min-match'),
    modalRemoteTypeSelect: $('#modal-remote-type-filter'),
    modalCountryScopeSelect: $('#modal-country-scope-filter'),
    modalDateRangeSelect: $('#modal-date-range-select'),
    searchInput: $('#search-input'),
    resetFiltersBtn: $('#reset-filters-btn'),
    openFiltersModalBtn: $('#open-filters-modal-btn'),
    closeFiltersModalBtn: $('#close-filters-modal-btn'),
    cancelFiltersModalBtn: $('#cancel-filters-modal-btn'),
    filtersModalOverlay: $('#filters-modal-overlay'),
    applyFiltersBtn: $('#apply-filters-btn'),
    modalResetFiltersBtn: $('#modal-reset-filters-btn'),
    activeFilterBadge: $('#active-filter-badge'),
    resultsSearchBar: $('#results-search-bar'),
    topSearchForm: $('#top-search-form'),
    topSearchInput: $('#top-search-input'),
    topSearchClearBtn: $('#top-search-clear-btn'),
    topSearchSubmitBtn: $('#top-search-submit-btn'),
    topSwitchResumeBtn: $('#top-switch-resume-btn'),
    logo: $('.logo'),

    // Header
    headerStats: $('#header-stats'),
    statTotal: $('#stat-total'),
    statSources: $('#stat-sources'),

    // Error
    errorSection: $('#error-section'),
    errorTitle: $('#error-title'),
    errorMessage: $('#error-message'),
    errorRetryBtn: $('#error-retry-btn'),

    // Modal
    modalOverlay: $('#modal-overlay'),
    modal: $('#job-modal'),
    modalTitle: $('#modal-title'),
    modalBody: $('#modal-body'),
    modalClose: $('#modal-close'),
    modalApplyLink: $('#modal-apply-link'),
    modalAutoApplyBtn: $('#modal-auto-apply-btn'),

    // Auto-Apply Modal
    autoApplyModalOverlay: $('#auto-apply-modal-overlay'),
    autoApplyModalClose: $('#auto-apply-modal-close'),
    autoApplyForm: $('#auto-apply-form'),
    applyTargetTitle: $('#apply-target-title'),
    applyTargetCompany: $('#apply-target-company'),
    applicantName: $('#applicant-name'),
    applicantEmail: $('#applicant-email'),
    applicantPhone: $('#applicant-phone'),
    applicantLinkedin: $('#applicant-linkedin'),
    applicantCoverLetter: $('#applicant-cover-letter'),
    regenerateCoverLetterBtn: $('#regenerate-cover-letter-btn'),
    sendCandidateCopyCheck: $('#send-candidate-copy-check'),
    copyEmailPreview: $('#copy-email-preview'),
    applyProgressCard: $('#apply-progress-card'),
    applyProgressStatus: $('#apply-progress-status'),
    autoApplySubmitBtn: $('#auto-apply-submit-btn'),
    autoApplyCancel: $('#auto-apply-cancel'),
    applySuccessCard: $('#apply-success-card'),
    applySuccessMsg: $('#apply-success-msg'),
    applySuccessCode: $('#apply-success-code'),
    companyDeliveryEmail: $('#company-delivery-email'),
    companyPreviewContainer: $('#company-preview-container'),
    companyPreviewLink: $('#company-preview-link'),
    candidateDeliveryEmail: $('#candidate-delivery-email'),
    candidateDeliveryBadge: $('#candidate-delivery-badge'),
    candidatePreviewContainer: $('#candidate-preview-container'),
    candidatePreviewLink: $('#candidate-preview-link'),
    viewSentCoverLetterBtn: $('#view-sent-cover-letter-btn'),
    applyDoneBtn: $('#apply-done-btn'),

    // SMTP Testing Controls
    testSmtpBtn: $('#test-smtp-btn'),
    smtpTestStatus: $('#smtp-test-status'),
    smtpHostInput: $('#smtp-host'),
    smtpUserInput: $('#smtp-user'),
    smtpPassInput: $('#smtp-pass'),

    // Candidate Profile Card & Edit Modal
    candidateProfileBanner: $('#candidate-profile-banner'),
    cardCandidateName: $('#card-candidate-name'),
    cardCandidateEmail: $('#card-candidate-email'),
    cardCandidatePhone: $('#card-candidate-phone'),
    cardCandidateLinkedin: $('#card-candidate-linkedin'),
    editCandidateProfileBtn: $('#edit-candidate-profile-btn'),
    profileEditModalOverlay: $('#profile-edit-modal-overlay'),
    profileEditModalClose: $('#profile-edit-modal-close'),
    profileEditCancel: $('#profile-edit-cancel'),
    profileEditForm: $('#profile-edit-form'),
    quickEditName: $('#quick-edit-name'),
    quickEditEmail: $('#quick-edit-email'),
    quickEditPhone: $('#quick-edit-phone'),
    quickEditLinkedin: $('#quick-edit-linkedin'),

    // View Sent Cover Letter Modal
    viewCoverLetterModalOverlay: $('#view-cover-letter-modal-overlay'),
    viewCoverLetterClose: $('#view-cover-letter-close'),
    viewCoverLetterDone: $('#view-cover-letter-done'),
    viewCoverLetterBody: $('#view-cover-letter-body')
  };

  // ─── Initialize ───────────────────────────────────────────────────────────
  function init() {
    bindUploadEvents();
    bindTabEvents();
    bindFilterEvents();
    bindModalEvents();
    bindMiscEvents();
    bindAlertEvents();
    bindProfileEditEvents();
    bindSmtpTestEvents();
    updateCandidateProfileDisplay();
    fetchApplications();
    restoreAppState();
  }

  // ─── State Persistence ───────────────────────────────────────────────────
  function saveAppState() {
    // Zero caching: Do not persist old search queries or results
  }

  async function restoreAppState() {
    try {
      // 1. Wipe any leftover candidate profile and search cache from browser storage
      localStorage.removeItem('remote_job_agent_candidate');
      localStorage.removeItem('remote_job_agent_resume');
      localStorage.removeItem('remote_job_agent_results');
      localStorage.removeItem('remote_job_agent_active_tab');

      // 2. Initialize clean candidate profile display
      state.candidateProfile = {};
      updateCandidateProfileDisplay();

      // 3. Restore saved SMTP settings
      const savedSmtp = JSON.parse(localStorage.getItem('remote_job_agent_smtp') || '{}');
      if (els.smtpUserInput && savedSmtp.user) els.smtpUserInput.value = savedSmtp.user;
      if (els.smtpHostInput && savedSmtp.host) els.smtpHostInput.value = savedSmtp.host;
      if (els.smtpPassInput && savedSmtp.pass) els.smtpPassInput.value = savedSmtp.pass;

      // 4. Load initial live remote feed across all 9 platforms
      fetchInitialLiveJobs();
    } catch (err) {
      console.error('Error restoring app state:', err);
    }
  }

  async function fetchInitialLiveJobs() {
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: { all: ['Software', 'Engineer', 'Developer', 'Frontend', 'Backend'] },
          titles: ['Software Engineer', 'Full Stack Developer'],
          keywords: ['developer', 'engineer', 'software'],
          experience: { level: 'mid' },
          maxDays: 30
        })
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data && (data.global?.length > 0 || data.worldwide?.length > 0)) {
        state.results = data;
        displayResults(data, true);
      }
    } catch (err) {
      console.warn('Initial live feed fetch:', err.message);
    }
  }

  function bindSmtpTestEvents() {
    if (els.testSmtpBtn) {
      els.testSmtpBtn.addEventListener('click', async () => {
        const user = (els.smtpUserInput?.value || '').trim();
        const pass = (els.smtpPassInput?.value || '').trim();
        const host = (els.smtpHostInput?.value || 'smtp.gmail.com').trim();

        if (!user || !pass) {
          if (els.smtpTestStatus) {
            els.smtpTestStatus.style.display = 'block';
            els.smtpTestStatus.style.color = '#ef4444';
            els.smtpTestStatus.textContent = 'Please enter both your email address and 16-character App Password.';
          }
          return;
        }

        if (els.smtpTestStatus) {
          els.smtpTestStatus.style.display = 'block';
          els.smtpTestStatus.style.color = '#38bdf8';
          els.smtpTestStatus.textContent = `Connecting to ${user}...`;
        }
        els.testSmtpBtn.disabled = true;

        try {
          const res = await fetch('/api/smtp-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpConfig: { host, user, pass }
            })
          });
          const data = await res.json();
          if (data.success) {
            if (els.smtpTestStatus) {
              els.smtpTestStatus.style.color = '#10b981';
              els.smtpTestStatus.textContent = '✅ ' + data.message;
            }
            localStorage.setItem('remote_job_agent_smtp', JSON.stringify({ host, user, pass }));
          } else {
            throw new Error(data.error || 'Connection failed');
          }
        } catch (err) {
          if (els.smtpTestStatus) {
            els.smtpTestStatus.style.color = '#ef4444';
            els.smtpTestStatus.textContent = '❌ ' + err.message;
          }
        } finally {
          els.testSmtpBtn.disabled = false;
        }
      });
    }
  }

  // ─── Upload Section Collapse / Expand ─────────────────────────────────────────
  function collapseUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    const expanded = document.getElementById('upload-expanded');
    const collapsed = document.getElementById('upload-collapsed');

    if (state.searchMode === 'keyword') {
      // If search is happened with keyword, hide the upload your resume component at the top completely
      if (uploadSection) uploadSection.style.display = 'none';
      if (expanded) expanded.style.display = 'none';
      if (collapsed) collapsed.style.display = 'none';
    } else {
      // If search is happened with resume upload, show the collapsed resume banner
      if (uploadSection) uploadSection.style.display = 'block';
      if (expanded) expanded.style.display = 'none';
      if (collapsed) collapsed.style.display = 'block';
    }
  }

  function expandUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) uploadSection.style.display = 'block';
    const expanded = document.getElementById('upload-expanded');
    const collapsed = document.getElementById('upload-collapsed');
    if (expanded) expanded.style.display = 'block';
    if (collapsed) collapsed.style.display = 'none';
    // Reset file input so user can re-upload same file
    if (els.uploadArea) els.uploadArea.style.display = 'block';
    if (els.uploadProgress) els.uploadProgress.style.display = 'none';
    if (els.fileInput) els.fileInput.value = '';
  }

  // ─── Alert Section / Modal Controls ─────────────────────────────────────
  function showAlertSection() {
    const openAlertBtn = $('#open-alert-modal-btn');
    if (openAlertBtn) openAlertBtn.style.display = 'inline-flex';
  }

  // ─── Alert Events (Modal & Real-time Notifier Settings) ───────────────────
  function bindAlertEvents() {
    const alertModalOverlay = $('#alert-modal-overlay');
    const openAlertModalBtn = $('#open-alert-modal-btn');
    const closeAlertModalBtn = $('#close-alert-modal-btn');
    const headerAlertPill = $('#header-alert-pill');
    const alertToggle = $('#alert-toggle');
    const alertEmailInput = $('#alert-email-input');
    const alertIntervalSelect = $('#alert-interval-select');
    const alertRegionSelect = $('#alert-region-select');
    const alertMinMatchSelect = $('#alert-min-match-select');
    const alertSmtpUser = $('#alert-smtp-user');
    const alertSmtpPass = $('#alert-smtp-pass');
    const saveAlertBtn = $('#save-alert-btn');
    const testAlertEmailBtn = $('#test-alert-email-btn');
    const triggerAlertBtn = $('#trigger-alert-btn');
    const alertStatusMsg = $('#alert-status-msg');

    // Update the header pill
    const updateAlertBadge = (isEnabled) => {
      if (!headerAlertPill) return;
      if (isEnabled) {
        headerAlertPill.textContent = 'Active';
        headerAlertPill.className = 'header-alert-pill';
      } else {
        headerAlertPill.textContent = 'Paused';
        headerAlertPill.className = 'header-alert-pill disabled';
      }
    };

    // Open & close Alert Modal
    const openAlertModal = () => {
      if (alertModalOverlay) alertModalOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };

    const closeAlertModal = () => {
      if (alertModalOverlay) alertModalOverlay.style.display = 'none';
      document.body.style.overflow = '';
    };

    if (openAlertModalBtn) openAlertModalBtn.addEventListener('click', openAlertModal);
    if (closeAlertModalBtn) closeAlertModalBtn.addEventListener('click', closeAlertModal);
    if (alertModalOverlay) {
      alertModalOverlay.addEventListener('click', (e) => {
        if (e.target === alertModalOverlay) closeAlertModal();
      });
    }

    // Fetch initial alert config
    fetch('/api/alerts/config')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.config) {
          const isEnabled = Boolean(res.config.enabled);
          if (alertToggle) alertToggle.value = String(isEnabled);
          updateAlertBadge(isEnabled);

          if (alertEmailInput && res.config.userEmail) alertEmailInput.value = res.config.userEmail;
          if (alertIntervalSelect && res.config.intervalHours) alertIntervalSelect.value = String(res.config.intervalHours);
          if (alertRegionSelect && res.config.regionScope) alertRegionSelect.value = res.config.regionScope;
          if (alertMinMatchSelect && res.config.minMatch !== undefined) alertMinMatchSelect.value = String(res.config.minMatch);
          if (alertSmtpUser && res.config.smtpConfig?.user) alertSmtpUser.value = res.config.smtpConfig.user;

          if (alertStatusMsg && res.config.lastRunStatus) {
            alertStatusMsg.style.display = 'block';
            alertStatusMsg.textContent = `Last status: ${res.config.lastRunStatus} (${res.seenCount || 0} seen jobs archived)`;
          }
        }
      })
      .catch(err => console.log('Alert config fetch error:', err));

    // Save alert config
    const saveConfig = () => {
      const enabled = alertToggle ? alertToggle.value === 'true' : false;
      updateAlertBadge(enabled);
      const userEmail = alertEmailInput ? alertEmailInput.value.trim() : '';
      const intervalHours = alertIntervalSelect ? parseInt(alertIntervalSelect.value, 10) : 8;
      const regionScope = alertRegionSelect ? alertRegionSelect.value : 'all';
      const minMatch = alertMinMatchSelect ? parseInt(alertMinMatchSelect.value, 10) : 0;
      const smtpUser = alertSmtpUser ? alertSmtpUser.value.trim() : '';
      const smtpPass = alertSmtpPass ? alertSmtpPass.value.trim() : '';

      const payload = { enabled, userEmail, intervalHours, regionScope, minMatch };
      if (smtpUser && smtpPass) {
        payload.smtpConfig = {
          host: 'smtp.gmail.com',
          port: 465,
          user: smtpUser,
          pass: smtpPass
        };
      }

      fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if (alertStatusMsg) {
            alertStatusMsg.style.display = 'block';
            alertStatusMsg.style.color = '#10b981';
            alertStatusMsg.textContent = data.message || 'Alert settings saved!';
          }
        })
        .catch(err => {
          if (alertStatusMsg) {
            alertStatusMsg.style.display = 'block';
            alertStatusMsg.style.color = '#ef4444';
            alertStatusMsg.textContent = 'Failed to save settings: ' + err.message;
          }
        });
    };

    if (saveAlertBtn) saveAlertBtn.addEventListener('click', saveConfig);
    if (alertToggle) alertToggle.addEventListener('change', saveConfig);
    if (alertIntervalSelect) alertIntervalSelect.addEventListener('change', saveConfig);
    if (alertRegionSelect) alertRegionSelect.addEventListener('change', saveConfig);
    if (alertMinMatchSelect) alertMinMatchSelect.addEventListener('change', saveConfig);

    // Send Test Email
    if (testAlertEmailBtn) {
      testAlertEmailBtn.addEventListener('click', () => {
        const userEmail = (alertEmailInput?.value || '').trim();
        if (!userEmail) {
          alert('Please enter your delivery email address first.');
          if (alertEmailInput) alertEmailInput.focus();
          return;
        }

        const smtpUser = alertSmtpUser ? alertSmtpUser.value.trim() : '';
        const smtpPass = alertSmtpPass ? alertSmtpPass.value.trim() : '';
        const smtpConfig = (smtpUser && smtpPass) ? { host: 'smtp.gmail.com', port: 465, user: smtpUser, pass: smtpPass } : null;

        if (alertStatusMsg) {
          alertStatusMsg.style.display = 'block';
          alertStatusMsg.style.color = '#38bdf8';
          alertStatusMsg.textContent = `✉️ Dispatching test alert email to ${userEmail}...`;
        }
        testAlertEmailBtn.disabled = true;

        fetch('/api/alerts/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail, smtpConfig })
        })
          .then(res => res.json())
          .then(data => {
            testAlertEmailBtn.disabled = false;
            if (data.success) {
              if (alertStatusMsg) {
                alertStatusMsg.style.display = 'block';
                alertStatusMsg.style.color = '#10b981';
                alertStatusMsg.innerHTML = `
                  ✅ <strong>${data.message}</strong>
                  ${data.previewUrl ? `<br><a href="${data.previewUrl}" target="_blank" style="color:#38bdf8; font-weight:bold;">🔗 Click to View Sent Email Preview ↗</a>` : ''}
                `;
              }
            } else {
              if (alertStatusMsg) {
                alertStatusMsg.style.display = 'block';
                alertStatusMsg.style.color = '#ef4444';
                alertStatusMsg.textContent = 'Test email failed: ' + (data.error || 'Unknown error');
              }
            }
          })
          .catch(err => {
            testAlertEmailBtn.disabled = false;
            if (alertStatusMsg) {
              alertStatusMsg.style.display = 'block';
              alertStatusMsg.style.color = '#ef4444';
              alertStatusMsg.textContent = 'Test email error: ' + err.message;
            }
          });
      });
    }

    // Trigger on-demand check now
    if (triggerAlertBtn) {
      triggerAlertBtn.addEventListener('click', () => {
        if (alertStatusMsg) {
          alertStatusMsg.style.display = 'block';
          alertStatusMsg.style.color = '#38bdf8';
          alertStatusMsg.textContent = '⚡ Checking 9 major remote platforms for new jobs...';
        }
        triggerAlertBtn.disabled = true;

        fetch('/api/alerts/trigger-check', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            triggerAlertBtn.disabled = false;
            if (data.success) {
              if (alertStatusMsg) {
                alertStatusMsg.style.display = 'block';
                alertStatusMsg.style.color = '#10b981';
                alertStatusMsg.innerHTML = `
                  ✅ Check Complete! Found <strong>${data.newCount} NEW jobs</strong>!
                  ${data.previewUrl ? `<br><a href="${data.previewUrl}" target="_blank" style="color:#38bdf8; font-weight:bold;">🔗 View Sent Alert Email Preview ↗</a>` : ''}
                `;
              }
            } else {
              if (alertStatusMsg) {
                alertStatusMsg.style.display = 'block';
                alertStatusMsg.style.color = '#ef4444';
                alertStatusMsg.textContent = 'Check failed: ' + (data.error || data.reason);
              }
            }
          })
          .catch(err => {
            triggerAlertBtn.disabled = false;
            if (alertStatusMsg) {
              alertStatusMsg.style.display = 'block';
              alertStatusMsg.style.color = '#ef4444';
              alertStatusMsg.textContent = 'Error: ' + err.message;
            }
          });
      });
    }
  }

  // ─── Upload Events ────────────────────────────────────────────────────────
  function bindUploadEvents() {
    if (els.uploadArea && els.fileInput) {
      // Click to upload
      els.uploadArea.addEventListener('click', () => els.fileInput.click());

      // File selected
      els.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileUpload(e.target.files[0]);
        }
      });

      // Drag and drop
      els.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.uploadArea.classList.add('drag-over');
      });

      els.uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        els.uploadArea.classList.remove('drag-over');
      });

      els.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      });
    }
  }

  // ─── File Upload Handler ──────────────────────────────────────────────────
  async function handleFileUpload(file) {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    const validExts = ['.pdf', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      showError('Invalid File Type', 'Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    // Show progress
    els.uploadArea.style.display = 'none';
    els.uploadProgress.style.display = 'block';
    els.progressFilename.textContent = file.name;
    els.progressStatus.textContent = 'Parsing resume...';
    hideError();

    try {
      // Upload and parse
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      state.searchMode = 'resume';
      state.resumeData = data.data;
      state.searchQuery = '';
      if (els.searchInput) els.searchInput.value = '';
      if (els.directKeywordInput) els.directKeywordInput.value = '';
      if (els.customKeywordsInput) els.customKeywordsInput.value = '';
      state.results = null;
      localStorage.removeItem('remote_job_agent_resume');
      localStorage.removeItem('remote_job_agent_results');

      els.progressStatus.textContent = 'Resume parsed! Searching jobs...';

      // Show resume summary & applicant profile
      displayResumeSummary(data.data);

      // Auto-start job search
      await searchJobs();

    } catch (err) {
      showError('Resume Parse Failed', err.message);
      resetUpload();
    }
  }

  // ─── Display Resume Summary ───────────────────────────────────────────────
  function displayResumeSummary(data) {
    els.uploadProgress.style.display = 'none';
    els.resumeSection.style.display = 'block';
    // Only scroll to resume section when triggered by a real user upload, not auto-load
    if (!state._autoLoading) {
      els.resumeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Basic info
    els.resumeFilename.textContent = data.fileName || '—';
    els.resumeExperience.textContent = data.experience?.label || 'Custom';
    const totalTermsCount = (data.keywords?.length || 0) + (data.skills?.all?.length || 0);
    els.resumeSkillsCount.textContent = totalTermsCount > 0 ? totalTermsCount : (data.skills?.count || 0);
    els.resumeTitlesCount.textContent = data.titles?.length || 0;

    // Clean up any old keywords or titles sections if present
    const oldKeywordsSection = document.getElementById('resume-keywords-detail');
    if (oldKeywordsSection) oldKeywordsSection.remove();
    const oldTitlesSection = document.getElementById('resume-titles-detail');
    if (oldTitlesSection) oldTitlesSection.remove();
    const oldSkillsSection = document.getElementById('resume-skills-detail');
    if (oldSkillsSection) oldSkillsSection.remove();

    // Auto-extract candidate contact information from resume for current session
    if (data.contact) {
      state.candidateProfile = {
        name: data.contact.name || state.candidateProfile?.name || '',
        email: data.contact.email || state.candidateProfile?.email || '',
        phone: data.contact.phone || state.candidateProfile?.phone || '',
        linkedin: data.contact.linkedin || state.candidateProfile?.linkedin || '',
        github: data.contact.github || state.candidateProfile?.github || ''
      };
      updateCandidateProfileDisplay();

      const alertEmailInput = $('#alert-email-input');
      if (alertEmailInput && !alertEmailInput.value && state.candidateProfile.email) {
        alertEmailInput.value = state.candidateProfile.email;
      }
    }

    // Populate custom keywords input with strictly unique terms (no duplicate entries)
    const seenTerms = new Set();
    const uniqueKeyTerms = [];
    const rawTerms = [
      ...(data.keywords || []),
      ...(data.skills?.all || []),
      ...(data.titles || [])
    ];
    for (const term of rawTerms) {
      if (!term || typeof term !== 'string') continue;
      const clean = term.trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (!seenTerms.has(lower)) {
        seenTerms.add(lower);
        uniqueKeyTerms.push(clean);
      }
    }
    if (els.customKeywordsInput) {
      els.customKeywordsInput.value = uniqueKeyTerms.slice(0, 25).join(', ');
    }
    saveAppState();
  }

  // ─── Candidate Profile Display & Edit Handlers ────────────────────────────
  function updateCandidateProfileDisplay() {
    const profile = state.candidateProfile || {};
    if (els.cardCandidateName) els.cardCandidateName.textContent = profile.name || '—';
    if (els.cardCandidateEmail) els.cardCandidateEmail.textContent = profile.email || '—';
    if (els.cardCandidatePhone) els.cardCandidatePhone.textContent = profile.phone || '—';
    if (els.cardCandidateLinkedin) {
      if (profile.linkedin) {
        const cleanLink = profile.linkedin.replace(/^https?:\/\/(www\.)?/, '');
        els.cardCandidateLinkedin.innerHTML = `<a href="${escapeHtml(profile.linkedin)}" target="_blank" rel="noopener" style="color:#38bdf8; text-decoration:none;">${escapeHtml(cleanLink)} ↗</a>`;
      } else {
        els.cardCandidateLinkedin.textContent = '—';
      }
    }
  }

  function bindProfileEditEvents() {
    if (els.editCandidateProfileBtn) {
      els.editCandidateProfileBtn.addEventListener('click', openProfileEditModal);
    }
    if (els.profileEditModalClose) {
      els.profileEditModalClose.addEventListener('click', closeProfileEditModal);
    }
    if (els.profileEditCancel) {
      els.profileEditCancel.addEventListener('click', closeProfileEditModal);
    }
    if (els.profileEditModalOverlay) {
      els.profileEditModalOverlay.addEventListener('click', (e) => {
        if (e.target === els.profileEditModalOverlay) closeProfileEditModal();
      });
    }
    if (els.profileEditForm) {
      els.profileEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.candidateProfile = {
          name: els.quickEditName.value.trim(),
          email: els.quickEditEmail.value.trim(),
          phone: els.quickEditPhone.value.trim(),
          linkedin: els.quickEditLinkedin.value.trim()
        };
        updateCandidateProfileDisplay();
        closeProfileEditModal();
      });
    }

    // Cover letter modal events
    if (els.viewSentCoverLetterBtn) {
      els.viewSentCoverLetterBtn.addEventListener('click', () => {
        if (state._lastSubmittedCoverLetter) {
          openCoverLetterModal(state._lastSubmittedCoverLetter);
        }
      });
    }
    if (els.viewCoverLetterClose) {
      els.viewCoverLetterClose.addEventListener('click', closeCoverLetterModal);
    }
    if (els.viewCoverLetterDone) {
      els.viewCoverLetterDone.addEventListener('click', closeCoverLetterModal);
    }
    if (els.viewCoverLetterModalOverlay) {
      els.viewCoverLetterModalOverlay.addEventListener('click', (e) => {
        if (e.target === els.viewCoverLetterModalOverlay) closeCoverLetterModal();
      });
    }
  }

  function openProfileEditModal() {
    const profile = state.candidateProfile || {};
    if (els.quickEditName) els.quickEditName.value = profile.name || '';
    if (els.quickEditEmail) els.quickEditEmail.value = profile.email || '';
    if (els.quickEditPhone) els.quickEditPhone.value = profile.phone || '';
    if (els.quickEditLinkedin) els.quickEditLinkedin.value = profile.linkedin || '';
    if (els.profileEditModalOverlay) els.profileEditModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeProfileEditModal() {
    if (els.profileEditModalOverlay) els.profileEditModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function openCoverLetterModal(letterText) {
    if (els.viewCoverLetterBody) els.viewCoverLetterBody.textContent = letterText || 'No cover letter content.';
    if (els.viewCoverLetterModalOverlay) els.viewCoverLetterModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeCoverLetterModal() {
    if (els.viewCoverLetterModalOverlay) els.viewCoverLetterModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ─── Applications Sync ────────────────────────────────────────────────────
  async function fetchApplications() {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success && Array.isArray(data.applications)) {
        const local = state.appliedJobs || [];
        const mergedMap = new Map();
        for (const app of data.applications) {
          mergedMap.set(app.applicationId, app);
        }
        for (const app of local) {
          if (!mergedMap.has(app.applicationId)) {
            mergedMap.set(app.applicationId, app);
          }
        }
        state.appliedJobs = Array.from(mergedMap.values()).sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
        localStorage.setItem('remote_job_agent_applied', JSON.stringify(state.appliedJobs));
      }
    } catch (err) {
      console.log('Using local applications storage:', err.message);
    }
    if (els.tabAppliedCount) {
      els.tabAppliedCount.textContent = state.appliedJobs.length;
    }
  }

  async function deleteAppliedJob(applicationId) {
    try {
      await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Backend delete failed:', err.message);
    }
    state.appliedJobs = state.appliedJobs.filter(a => a.applicationId !== applicationId);
    localStorage.setItem('remote_job_agent_applied', JSON.stringify(state.appliedJobs));
    if (els.tabAppliedCount) {
      els.tabAppliedCount.textContent = state.appliedJobs.length;
    }
    renderAppliedJobList();
  }

  // ─── Job Search ───────────────────────────────────────────────────────────
  async function searchJobs() {
    if (!state.resumeData) return;

    // Show searching modal
    if (els.searchingModalOverlay) {
      els.searchingModalOverlay.style.display = 'flex';
      if (els.searchingTitle) {
        els.searchingTitle.textContent = (state.searchMode === 'keyword' && state.resumeData.keywords?.length)
          ? `Searching Jobs for "${state.resumeData.keywords.slice(0, 3).join(', ')}"...`
          : 'Matching Remote Jobs to Your Resume...';
      }
    }
    els.resultsSection.style.display = 'none';

    // Animate source chips
    animateSourceChips();

    try {
      const maxDays = els.dateRangeSelect ? parseInt(els.dateRangeSelect.value, 10) : 30;

      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: state.resumeData.skills,
          titles: state.resumeData.titles,
          experience: state.resumeData.experience,
          keywords: state.resumeData.keywords || [],
          maxDays: maxDays
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search jobs');
      }

      state.results = data.data;
      saveAppState();

      // Hide searching modal, show results
      if (els.searchingModalOverlay) els.searchingModalOverlay.style.display = 'none';
      displayResults(data.data);
      showAlertSection();
      collapseUploadSection();  // Collapse upload to compact banner after results load

    } catch (err) {
      if (els.searchingModalOverlay) els.searchingModalOverlay.style.display = 'none';
      showError('Job Search Failed', err.message);
    }
  }

  // ─── Animate Source Chips ─────────────────────────────────────────────────
  function animateSourceChips() {
    const messages = [
      'Querying 9 major remote platforms in parallel...',
      'Scanning Remotive & RemoteOK opportunities...',
      'Checking Himalayas & WeWorkRemotely feeds...',
      'Fetching Working Nomads & NoDesk postings...',
      'Browsing Arbeitnow & Jobicy listings...',
      'Filtering 100% remote roles only...',
      'Calculating match scores for your skills...',
      'Classifying India vs Worldwide remote...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= messages.length || (els.searchingModalOverlay && els.searchingModalOverlay.style.display === 'none')) {
        clearInterval(interval);
        return;
      }
      if (els.searchingStatus) els.searchingStatus.textContent = messages[i];
      i++;
    }, 1200);
  }

  // ─── Display Results ──────────────────────────────────────────────────────
  function displayResults(data, isTrending = false) {
    if (!data) return;
    els.resultsSection.style.display = 'block';

    const stats = data.stats || {};
    const totalCount = stats.totalMatched || (data.global?.length || 0);

    // Sync top persistent keyword search bar
    if (els.topSearchInput) {
      if (state.searchMode === 'keyword' && state.resumeData?.keywords?.length) {
        els.topSearchInput.value = state.resumeData.keywords.join(', ');
        if (els.topSearchClearBtn) els.topSearchClearBtn.style.display = 'block';
      } else {
        els.topSearchInput.value = '';
        if (els.topSearchClearBtn) els.topSearchClearBtn.style.display = 'none';
      }
    }

    // Update tab counts
    if (els.tabWorldwideCount) els.tabWorldwideCount.textContent = data.worldwide?.length || 0;
    if (els.tabIndiaCount) els.tabIndiaCount.textContent = data.india?.length || 0;
    if (els.tabGlobalCount) els.tabGlobalCount.textContent = data.global?.length || 0;
    if (els.tabAppliedCount) {
      els.tabAppliedCount.textContent = state.appliedJobs.length;
    }

    // Update header stats
    els.headerStats.style.display = 'flex';
    els.statTotal.textContent = totalCount;

    // Auto-select tab that has jobs if current tab is empty
    if (!isTrending && !state._restoring) {
      const currentTabJobs = (state.activeTab === 'worldwide' ? data.worldwide : (state.activeTab === 'india' ? data.india : data.global)) || [];
      if (currentTabJobs.length === 0) {
        if (data.worldwide && data.worldwide.length > 0) {
          switchTab('worldwide');
        } else if (data.india && data.india.length > 0) {
          switchTab('india');
        } else if (data.global && data.global.length > 0) {
          switchTab('global');
        }
      }
    }

    // Render job lists
    renderJobList();

    // Scroll to results if user initiated search
    if (!isTrending && !state._restoring) {
      els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ─── Render Job List ──────────────────────────────────────────────────────
  function renderJobList() {
    if (els.tabAppliedCount) {
      els.tabAppliedCount.textContent = state.appliedJobs.length;
    }

    if (state.activeTab === 'applied') {
      renderAppliedJobList();
      return;
    }

    if (!state.results) return;

    let jobs = [];
    if (state.activeTab === 'worldwide') {
      jobs = state.results.worldwide || state.results.global?.filter(j => j.isWorldwide || j.remoteType === 'worldwide') || [];
    } else if (state.activeTab === 'india') {
      jobs = state.results.india || [];
    } else {
      jobs = state.results.global || [];
    }

    // Apply filters
    let filtered = filterJobs(jobs);

    // Apply sort
    filtered = sortJobs(filtered);

    // Show/hide lists
    if (els.jobListWorldwide) els.jobListWorldwide.style.display = state.activeTab === 'worldwide' ? 'grid' : 'none';
    if (els.jobListIndia) els.jobListIndia.style.display = state.activeTab === 'india' ? 'grid' : 'none';
    if (els.jobListGlobal) els.jobListGlobal.style.display = state.activeTab === 'global' ? 'grid' : 'none';
    if (els.jobListApplied) els.jobListApplied.style.display = 'none';

    let targetList;
    if (state.activeTab === 'worldwide') targetList = els.jobListWorldwide;
    else if (state.activeTab === 'india') targetList = els.jobListIndia;
    else targetList = els.jobListGlobal;

    if (!targetList) return;

    if (filtered.length === 0) {
      targetList.innerHTML = '';
      els.emptyState.style.display = 'flex';
      return;
    }

    els.emptyState.style.display = 'none';
    targetList.innerHTML = filtered.map((job, index) => createJobCard(job, index)).join('');

    // Bind click events on job cards for collapsible accordion
    targetList.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicking a direct external posting link, let browser open target="_blank" natively!
        if (e.target.closest('.job-posting-link') || e.target.closest('a[target="_blank"]')) {
          e.stopPropagation();
          return;
        }

        const jobId = card.dataset.jobId;
        const allJobs = [...(state.results.worldwide || []), ...(state.results.india || []), ...(state.results.global || [])];
        const job = allJobs.find(j => j.id === jobId);

        if (e.target.closest('.job-details-btn')) {
          e.stopPropagation();
          if (job) openJobModal(job);
          return;
        }

        if (e.target.closest('.job-auto-apply-btn')) {
          e.stopPropagation();
          if (job) triggerAutoApplyModal(job);
          return;
        }

        // On Mobile: Toggle expand/collapse accordion drawer
        if (window.innerWidth <= 768) {
          const expandedEl = card.querySelector('.job-card-expanded');
          if (expandedEl) {
            const isCurrentlyOpen = card.classList.contains('expanded');
            if (isCurrentlyOpen) {
              card.classList.remove('expanded');
              expandedEl.style.display = 'none';
            } else {
              card.classList.add('expanded');
              expandedEl.style.display = 'block';
            }
          }
        } else {
          // On Desktop: Clicking the title / company summary opens the detailed modal
          if (e.target.closest('.job-card-summary-left') || e.target.closest('.job-title')) {
            if (job) openJobModal(job);
          }
        }
      });
    });
  }

  // ─── Render Applied Job List ──────────────────────────────────────────────
  function renderAppliedJobList() {
    if (!els.jobListApplied) return;

    if (els.jobListWorldwide) els.jobListWorldwide.style.display = 'none';
    if (els.jobListIndia) els.jobListIndia.style.display = 'none';
    if (els.jobListGlobal) els.jobListGlobal.style.display = 'none';
    els.jobListApplied.style.display = 'grid';
    els.emptyState.style.display = 'none';

    if (state.appliedJobs.length === 0) {
      els.jobListApplied.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 40px; background:var(--glass-bg); border-radius:var(--radius-lg); border:1px solid var(--glass-border);">
          <div style="font-size:2.5rem; margin-bottom:12px;">📋</div>
          <h3 style="margin-bottom:6px; color:var(--text-primary);">No Applied Jobs Yet</h3>
          <p style="color:var(--text-secondary); font-size:0.9rem;">Click "🤖 Auto-Apply" on any job listing to dispatch your application and resume.</p>
        </div>
      `;
      return;
    }

    els.jobListApplied.innerHTML = state.appliedJobs.map((app, index) => {
      const job = app.job || {};
      const companyPreview = app.companyResult?.previewUrl || app.previewUrl;
      const candidatePreview = app.candidateResult?.previewUrl;
      const appliedDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
      const appliedTime = app.appliedAt ? new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      return `
        <article class="job-card applied-job" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s; border-color: rgba(99,102,241,0.25);">
          <div class="job-card-summary">
            <div class="job-card-summary-left">
              <div class="job-company-logo" style="background: linear-gradient(135deg, #10b981, #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; border-radius: 8px;">
                ✓
              </div>
              <div class="job-card-info">
                <h3 class="job-title" style="color:var(--text-primary);">${escapeHtml(job.title || 'Applied Position')}</h3>
                <div class="job-card-subline">
                  <span class="job-company">${escapeHtml(job.company || 'Company')}</span>
                  <span class="job-subline-dot">•</span>
                  <span class="job-date">${appliedDate}</span>
                </div>
              </div>
            </div>
            <div class="job-card-summary-right">
              <span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:0.75rem; font-weight:700;">
                SENT 🟢
              </span>
              <div class="job-expand-chevron">
                <span class="material-symbols-rounded">expand_more</span>
              </div>
            </div>
          </div>

          <div class="job-card-expanded" style="display:none;">
            <div class="job-expanded-divider"></div>
            <div style="background:var(--md-sys-color-surface-container-low); padding:10px 14px; border-radius:8px; font-size:0.82rem; color:var(--md-sys-color-on-surface-variant); line-height:1.6; margin-bottom:12px; border:1px solid var(--md-sys-color-outline-variant);">
              <div><strong>Company HR:</strong> <span style="color:#38bdf8;">${escapeHtml(app.recipientEmail || 'careers@company.com')}</span></div>
              <div><strong>Sent Date:</strong> ${appliedDate} ${appliedTime ? 'at ' + appliedTime : ''}</div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; flex-wrap:wrap; gap:6px;">
                <span style="font-family:monospace; color:var(--text-accent); font-size:0.78rem;">Ref: ${escapeHtml(app.applicationId || 'APP')}</span>
                <span style="color:#10b981; font-size:0.78rem;">📎 ${escapeHtml(app.resumeFilename || 'Resume attached')}</span>
              </div>
            </div>

            <div class="job-expanded-footer">
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${app.coverLetter ? `
                  <button type="button" class="btn btn-ghost btn-sm view-app-cover-letter-btn" data-app-id="${escapeHtml(app.applicationId)}" style="padding:4px 10px; font-size:0.78rem;">
                    📝 Cover Letter
                  </button>
                ` : ''}
                ${companyPreview ? `
                  <a class="btn btn-ghost btn-sm" href="${escapeHtml(companyPreview)}" target="_blank" rel="noopener noreferrer" style="padding:4px 10px; font-size:0.78rem; color:#38bdf8; border-color:rgba(56,189,248,0.3); text-decoration:none;">
                    🏢 HR Email ↗
                  </a>
                ` : ''}
                ${candidatePreview ? `
                  <a class="btn btn-ghost btn-sm" href="${escapeHtml(candidatePreview)}" target="_blank" rel="noopener noreferrer" style="padding:4px 10px; font-size:0.78rem; color:#818cf8; border-color:rgba(129,140,248,0.3); text-decoration:none;">
                    📬 Confirmation ↗
                  </a>
                ` : ''}
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <a class="btn btn-ghost btn-sm job-posting-link" href="${escapeHtml(job.url || '#')}" target="_blank" rel="noopener noreferrer" style="padding:4px 10px; font-size:0.78rem; text-decoration:none;">
                  Posting ↗
                </a>
                <button type="button" class="btn btn-ghost btn-sm delete-app-btn" data-app-id="${escapeHtml(app.applicationId)}" title="Delete from history" style="padding:4px 8px; font-size:0.78rem; color:var(--text-muted);">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Bind cover letter modals and delete buttons on applied jobs
    bindAppliedJobEvents();
  }

  function bindAppliedJobEvents() {
    if (!els.jobListApplied) return;

    // Toggle expand on applied job cards
    els.jobListApplied.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
          return;
        }
        const expandedEl = card.querySelector('.job-card-expanded');
        if (expandedEl) {
          const isCurrentlyOpen = card.classList.contains('expanded');
          if (isCurrentlyOpen) {
            card.classList.remove('expanded');
            expandedEl.style.display = 'none';
          } else {
            card.classList.add('expanded');
            expandedEl.style.display = 'block';
          }
        }
      });
    });

    // View cover letter button
    els.jobListApplied.querySelectorAll('.view-app-cover-letter-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const appId = btn.getAttribute('data-app-id');
        const found = state.appliedJobs.find(a => a.applicationId === appId);
        if (found && found.coverLetter) {
          openCoverLetterModal(found.coverLetter);
        }
      };
    });

    // Delete applied job button
    els.jobListApplied.querySelectorAll('.delete-app-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const appId = btn.getAttribute('data-app-id');
        if (confirm('Remove this application record from tracker?')) {
          await deleteAppliedJob(appId);
        }
      };
    });
  }

  // ─── Filter Jobs ──────────────────────────────────────────────────────────
  function filterJobs(jobs) {
    if (!jobs) return [];
    return jobs.filter(job => {
      // Min match score filter
      if (job.matchScore < state.minMatch) return false;

      // Remote Type filter (Workplace Arrangement)
      const isWorldwide = job.regionInfo?.isWorldwide || job.remoteType === 'worldwide';
      if (state.remoteType === 'worldwide' && !isWorldwide) return false;
      if (state.remoteType === 'country_restricted' && isWorldwide) return false;

      // Country / Regional Scope filter
      const countryScope = job.regionInfo?.countryScope || job.countryScope || '';
      const isIndiaEligible = job.regionInfo?.indiaEligible || false;

      if (state.countryScope === 'worldwide' && !isWorldwide) return false;
      if (state.countryScope === 'india' && !isIndiaEligible) return false;
      if (state.countryScope === 'us' && countryScope !== 'us') return false;
      if (state.countryScope === 'europe' && countryScope !== 'europe') return false;
      if (state.countryScope === 'apac' && countryScope !== 'apac') return false;
      if (state.countryScope === 'latam' && countryScope !== 'latam') return false;

      // Search query filter (live text search)
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const searchText = [
          job.title, job.company, job.location,
          job.remoteTypeLabel, job.countryLabel,
          ...(job.tags || []), ...(job.matchedSkills || []), ...(job.matchedKeywords || [])
        ].join(' ').toLowerCase();
        if (!searchText.includes(query)) return false;
      }

      return true;
    });
  }

  // ─── Sort Jobs ────────────────────────────────────────────────────────────
  function sortJobs(jobs) {
    const sorted = [...jobs];
    switch (state.sortBy) {
      case 'match':
        sorted.sort((a, b) => b.matchScore - a.matchScore || (a.daysAgo || 99) - (b.daysAgo || 99));
        break;
      case 'date':
        sorted.sort((a, b) => (a.daysAgo || 99) - (b.daysAgo || 99));
        break;
      case 'company':
        sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
    }
    return sorted;
  }

  // ─── Create Job Card HTML ─────────────────────────────────────────────────
  function createJobCard(job, index) {
    const scoreClass = job.matchScore >= 70 ? 'high' : job.matchScore >= 40 ? 'medium' : 'low';

    // Company logo (colored circle with initials)
    const initials = getCompanyInitials(job.company);
    const logoColor = getCompanyColor(job.company);

    // Date display
    const dateText = job.daysAgo !== null && job.daysAgo !== undefined
      ? (job.daysAgo === 0 ? 'Today' : job.daysAgo === 1 ? 'Yesterday' : `${job.daysAgo}d ago`)
      : 'Recent';

    // Safe tag extraction
    const rawTags = Array.isArray(job.tags) ? job.tags.flat(Infinity) : (job.tags ? Object.values(job.tags) : []);
    const cleanTags = rawTags
      .map(t => typeof t === 'string' ? t : (t && t.name ? t.name : String(t || '')))
      .filter(t => t.trim().length > 0);

    const tags = cleanTags.slice(0, 10);
    const matchedLower = (job.matchedSkills || []).map(s => String(s).toLowerCase());

    const tagsHtml = tags.map(tag => {
      const tagStr = String(tag);
      const isMatched = matchedLower.includes(tagStr.toLowerCase());
      return `<span class="job-tag${isMatched ? ' matched' : ''}">${escapeHtml(tagStr)}</span>`;
    }).join('');

    const isWorldwide = job.regionInfo?.isWorldwide || job.remoteType === 'worldwide';

    const cleanDescription = (job.description || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return `
      <article class="job-card ${isWorldwide ? 'worldwide-job' : 'regional-job'}"
               data-job-id="${escapeHtml(job.id)}"
               data-job-url="${escapeHtml(job.url)}"
               style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">

        <!-- ═══ Compact Collapsed Header Row (Always Visible) ═══ -->
        <div class="job-card-summary">
          <div class="job-card-summary-left">
            <div class="job-company-logo" style="background: ${logoColor}">
              ${initials}
            </div>
            <div class="job-card-info">
              <h3 class="job-title" title="${escapeHtml(job.title)}">
                ${escapeHtml(job.title)}
              </h3>
              <div class="job-card-subline">
                <span class="job-company">${escapeHtml(job.company)}</span>
                <span class="job-subline-dot">•</span>
                <span class="job-meta-pill ${isWorldwide ? 'pill-worldwide' : 'pill-regional'}">
                  ${isWorldwide ? '🌐 Worldwide' : (job.regionInfo?.badge || '📍 Remote')}
                </span>
                ${job.seniority && job.seniority !== 'All Experience Levels' ? `
                  <span class="job-subline-dot">•</span>
                  <span class="job-meta-pill pill-seniority" style="font-size:0.72rem; background:rgba(99,102,241,0.12); color:#818cf8; border:1px solid rgba(99,102,241,0.25);">🎓 ${escapeHtml(job.seniority)}</span>
                ` : ''}
                ${job.salary ? `
                  <span class="job-subline-dot">•</span>
                  <span class="job-meta-pill pill-salary">💰 ${escapeHtml(job.salary)}</span>
                ` : ''}
                <span class="job-subline-dot">•</span>
                <span class="job-date">${dateText}</span>
              </div>
            </div>
          </div>

          <div class="job-card-summary-right">
            <div class="match-score-badge ${scoreClass}" title="${job.matchScore}% match">
              ${job.matchScore}%
            </div>
            <div class="job-expand-chevron">
              <span class="material-symbols-rounded">expand_more</span>
            </div>
          </div>
        </div>

        <!-- ═══ Compact Expanded Details Drawer ═══ -->
        <div class="job-card-expanded" style="display:none;">
          <div class="job-expanded-divider"></div>

          <div class="job-expanded-summary-row">
            ${(job.matchedSkills?.length || job.matchedKeywords?.length) ? `
              <div class="job-expanded-matched">
                <span class="matched-label">Matched:</span>
                ${[...(job.matchedSkills || []), ...(job.matchedKeywords || [])].slice(0, 4).map(m => `<span class="skill-pill matched" style="font-size:0.72rem; padding:1px 6px;">✓ ${escapeHtml(String(m))}</span>`).join('')}
              </div>
            ` : ''}
            <div class="job-expanded-meta-inline">
              <span>📍 ${escapeHtml(job.location || 'Remote')}</span>
              <span>•</span>
              <span>🔗 ${escapeHtml(job.source)}</span>
            </div>
          </div>

          ${cleanDescription ? `
            <p class="job-expanded-snippet">${escapeHtml(truncate(cleanDescription, 200))}</p>
          ` : ''}

          <!-- Quick Action Hyperlinks / Buttons -->
          <div class="job-expanded-actions">
            <button type="button" class="btn btn-ghost btn-sm job-details-btn" data-job-id="${escapeHtml(job.id)}" style="padding:4px 10px; font-size:0.78rem;">
              <span class="material-symbols-rounded" style="font-size:15px;">article</span>
              Full Details
            </button>
            <a class="btn btn-ghost btn-sm job-posting-link" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" style="padding:4px 10px; font-size:0.78rem; text-decoration:none;">
              <span>View Posting</span>
              <span class="material-symbols-rounded" style="font-size:14px;">open_in_new</span>
            </a>
            <button type="button" class="btn btn-primary btn-sm job-auto-apply-btn" data-job-id="${escapeHtml(job.id)}" style="padding:4px 12px; font-size:0.78rem;">
              <span class="material-symbols-rounded" style="font-size:15px;">send</span>
              Auto-Apply
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // ─── Job Modal ────────────────────────────────────────────────────────────
  function openJobModal(job) {
    const matchedLower = (job.matchedSkills || []).map(s => s.toLowerCase());

    // Meta items
    let metaHtml = `
      <div class="modal-meta" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px;">
        <span class="job-meta-item">📍 ${escapeHtml(job.location || 'Worldwide Remote')}</span>
        ${job.seniority ? `<span class="job-meta-item" style="color:#818cf8; background:rgba(99,102,241,0.12); border-color:rgba(99,102,241,0.3);">🎓 ${escapeHtml(job.seniority)}</span>` : ''}
        ${job.jobType ? `<span class="job-meta-item">💼 ${escapeHtml(job.jobType)}</span>` : ''}
        ${job.salary ? `<span class="job-meta-item salary">💰 ${escapeHtml(job.salary)}</span>` : ''}
        <span class="job-meta-item source-badge">🔗 ${escapeHtml(job.source)}</span>
        <span class="job-meta-item">📅 ${job.daysAgo !== null ? (job.daysAgo === 0 ? 'Today' : `${job.daysAgo}d ago`) : 'Recent'}</span>
        <span class="job-meta-item" style="color:#10b981; font-weight:700;">🎯 ${job.matchScore}% Match</span>
      </div>
    `;

    // Matched skills
    let matchedHtml = '';
    const allMatches = [...(job.matchedSkills || []), ...(job.matchedKeywords || [])];
    if (allMatches.length > 0) {
      matchedHtml = `
        <h4 style="margin-bottom:8px; font-size:0.9rem; color:var(--md-sys-color-primary);">✅ Matched Skills &amp; Keywords</h4>
        <div class="skill-pills" style="margin-bottom: 18px; display:flex; flex-wrap:wrap; gap:6px;">
          ${allMatches.map(s => `<span class="skill-pill matched" style="font-size:0.75rem; padding:3px 8px;">✓ ${escapeHtml(String(s))}</span>`).join('')}
        </div>
      `;
    }

    // Tags
    let tagsHtml = '';
    const rawModalTags = Array.isArray(job.tags) ? job.tags.flat(Infinity) : (job.tags ? Object.values(job.tags) : []);
    const modalTags = rawModalTags
      .map(t => typeof t === 'string' ? t : (t && t.name ? t.name : String(t || '')))
      .filter(t => t.trim().length > 0);

    if (modalTags.length > 0) {
      tagsHtml = `
        <h4 style="margin-bottom:8px; font-size:0.9rem; color:var(--md-sys-color-on-surface-variant);">🏷️ Technologies &amp; Categories</h4>
        <div class="job-tags" style="margin-bottom: 18px; display:flex; flex-wrap:wrap; gap:6px;">
          ${modalTags.map(t => {
            const tagStr = String(t);
            const isMatched = matchedLower.includes(tagStr.toLowerCase());
            return `<span class="job-tag${isMatched ? ' matched' : ''}" style="font-size:0.75rem; padding:3px 8px;">${escapeHtml(tagStr)}</span>`;
          }).join('')}
        </div>
      `;
    }

    // Format rich full description
    const rawDesc = job.descriptionHtml || job.fullDescription || job.description || 'No description available.';
    let descBodyHtml = rawDesc;
    if (!rawDesc.includes('<p>') && !rawDesc.includes('<div>') && !rawDesc.includes('<ul>')) {
      descBodyHtml = rawDesc
        .split('\n\n')
        .map(p => `<p style="margin-bottom:12px; line-height:1.7; color:var(--md-sys-color-on-surface-variant); font-size:0.88rem;">${escapeHtml(p)}</p>`)
        .join('');
    }

    els.modalTitle.textContent = `${job.title} — ${job.company}`;
    els.modalBody.innerHTML = `
      <div style="margin-bottom:16px;">
        <a class="btn btn-primary job-posting-link" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" style="width:100%; padding:12px; justify-content:center; text-decoration:none; font-weight:700; background:linear-gradient(135deg, var(--accent-primary), #4f46e5); color:#ffffff; display:flex; align-items:center; gap:8px;">
          🌐 Open &amp; Apply Direct on ${escapeHtml(job.source)} ↗
        </a>
      </div>
      ${metaHtml}
      ${matchedHtml}
      ${tagsHtml}
      <h4 style="margin-bottom:10px; font-size:0.95rem; color:var(--md-sys-color-on-surface); border-top:1px solid var(--md-sys-color-outline-variant); padding-top:14px;">📝 Complete Job Description</h4>
      <div class="job-modal-description" style="line-height: 1.7; color: var(--md-sys-color-on-surface-variant); font-size:0.88rem; max-height:450px; overflow-y:auto; padding-right:6px;">
        ${descBodyHtml}
      </div>
    `;

    if (els.modalApplyLink) {
      els.modalApplyLink.href = job.url || '#';
      els.modalApplyLink.onclick = (e) => {
        e.preventDefault();
        window.open(job.url, '_blank', 'noopener,noreferrer');
      };
    }
    if (els.modalAutoApplyBtn) {
      els.modalAutoApplyBtn.onclick = () => {
        closeJobModal();
        triggerAutoApplyModal(job);
      };
    }

    els.modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeJobModal() {
    els.modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function bindModalEvents() {
    if (els.modalClose) els.modalClose.addEventListener('click', closeJobModal);
    if (els.modalOverlay) {
      els.modalOverlay.addEventListener('click', (e) => {
        if (e.target === els.modalOverlay) closeJobModal();
      });
    }

    if (els.autoApplyModalClose) els.autoApplyModalClose.addEventListener('click', closeAutoApplyModal);
    if (els.autoApplyCancel) els.autoApplyCancel.addEventListener('click', closeAutoApplyModal);
    if (els.autoApplyModalOverlay) {
      els.autoApplyModalOverlay.addEventListener('click', (e) => {
        if (e.target === els.autoApplyModalOverlay) closeAutoApplyModal();
      });
    }

    if (els.autoApplyForm) els.autoApplyForm.addEventListener('submit', handleAutoApplySubmit);
    if (els.applyDoneBtn) {
      els.applyDoneBtn.addEventListener('click', () => {
        closeAutoApplyModal();
        switchTab('applied');
      });
    }
    if (els.regenerateCoverLetterBtn) {
      els.regenerateCoverLetterBtn.addEventListener('click', () => {
        if (state.targetJobForApply) generateTailoredCoverLetter(state.targetJobForApply);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeJobModal();
        closeAutoApplyModal();
        const alertModal = document.getElementById('alert-modal-overlay');
        if (alertModal) {
          alertModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      }
    });
  }

  // ─── Auto-Apply Workflow ──────────────────────────────────────────────────
  function triggerAutoApplyModal(job) {
    state.targetJobForApply = job;

    if (els.applyTargetTitle) els.applyTargetTitle.textContent = job.title;
    if (els.applyTargetCompany) els.applyTargetCompany.textContent = `${job.company} • ${job.location || 'Remote'} (${job.source})`;

    const saved = state.candidateProfile || {};
    if (els.applicantName) els.applicantName.value = saved.name || (state.resumeData?.fileName ? state.resumeData.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '');
    if (els.applicantEmail) els.applicantEmail.value = saved.email || '';
    if (els.applicantPhone) els.applicantPhone.value = saved.phone || '';
    if (els.applicantLinkedin) els.applicantLinkedin.value = saved.linkedin || '';

    // Update candidate email copy preview
    if (els.copyEmailPreview) {
      els.copyEmailPreview.textContent = els.applicantEmail?.value || 'applicant@example.com';
    }
    if (els.applicantEmail) {
      els.applicantEmail.oninput = () => {
        if (els.copyEmailPreview) els.copyEmailPreview.textContent = els.applicantEmail.value || 'applicant@example.com';
      };
    }

    // Auto-detect or construct HR recipient email
    const recipientInput = $('#recipient-hr-email');
    if (recipientInput) {
      const companySlug = (job.company || 'company').toLowerCase().replace(/[^a-z0-9]/g, '');
      const descEmailMatch = (job.fullDescription || job.description || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      recipientInput.value = descEmailMatch ? descEmailMatch[0] : `careers@${companySlug || 'company'}.com`;
    }

    // Display attached resume info
    const attachmentBadge = $('#resume-attachment-badge');
    const attachmentName = $('#resume-attachment-name');
    if (attachmentBadge && attachmentName) {
      if (state.resumeData?.fileName) {
        attachmentBadge.textContent = '📎 Resume File Attached: Yes';
        attachmentName.textContent = state.resumeData.fileName;
      } else {
        attachmentBadge.textContent = '📎 Resume Attached: Profile Snapshot';
        attachmentName.textContent = 'Candidate Profile Data';
      }
    }

    if (els.autoApplyForm) els.autoApplyForm.style.display = 'block';
    if (els.applyProgressCard) els.applyProgressCard.style.display = 'none';
    if (els.applySuccessCard) els.applySuccessCard.style.display = 'none';

    generateTailoredCoverLetter(job);

    if (els.autoApplyModalOverlay) els.autoApplyModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  async function generateTailoredCoverLetter(job) {
    if (!els.applicantCoverLetter) return;
    els.applicantCoverLetter.value = '✨ Generating a tailored cover letter for ' + job.company + '...';

    try {
      const candidateName = els.applicantName?.value?.trim() || state.candidateProfile?.name || 'Candidate';
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidateName,
          jobTitle: job.title,
          company: job.company,
          skills: state.resumeData?.skills?.all || job.matchedSkills || [],
          titles: state.resumeData?.titles || [],
          experience: state.resumeData?.experience?.label || 'Professional',
          matchedSkills: job.matchedSkills || []
        })
      });
      const data = await response.json();
      if (data.success) {
        els.applicantCoverLetter.value = data.coverLetter;
      }
    } catch (err) {
      const candidateName = els.applicantName?.value?.trim() || 'Candidate';
      els.applicantCoverLetter.value = `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With relevant experience in modern software engineering and remote collaboration, I am confident I can contribute meaningfully to your team.\n\nMy resume is attached for your review. I look forward to hearing from you.\n\nBest regards,\n${candidateName}`;
    }
  }

  function closeAutoApplyModal() {
    if (els.autoApplyModalOverlay) els.autoApplyModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  async function handleAutoApplySubmit(e) {
    e.preventDefault();
    const job = state.targetJobForApply;
    if (!job) return;

    const profile = {
      name: els.applicantName.value.trim(),
      email: els.applicantEmail.value.trim(),
      phone: els.applicantPhone.value.trim(),
      linkedin: els.applicantLinkedin.value.trim()
    };
    state.candidateProfile = profile;
    updateCandidateProfileDisplay();

    const hrEmail = $('#recipient-hr-email')?.value?.trim() || `careers@company.com`;
    const smtpHost = $('#smtp-host')?.value?.trim();
    const smtpUser = $('#smtp-user')?.value?.trim();
    const smtpPass = $('#smtp-pass')?.value?.trim();
    const sendCandidateCopy = els.sendCandidateCopyCheck ? els.sendCandidateCopyCheck.checked : true;

    const smtpConfig = (smtpUser && smtpPass) ? { host: smtpHost, user: smtpUser, pass: smtpPass } : null;

    if (els.applyProgressCard) els.applyProgressCard.style.display = 'block';
    if (els.applyProgressStatus) els.applyProgressStatus.textContent = `Packaging resume attachment and tailored cover letter for ${job.company}...`;

    setTimeout(async () => {
      if (els.applyProgressStatus) {
        els.applyProgressStatus.textContent = `Dispatching outbound email to ${hrEmail}${sendCandidateCopy ? ' & copy to ' + profile.email : ''}...`;
      }

      try {
        const response = await fetch('/api/apply-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate: profile,
            job: job,
            recipientEmail: hrEmail,
            smtpConfig: smtpConfig,
            sendCandidateCopy: sendCandidateCopy,
            coverLetter: els.applicantCoverLetter.value
          })
        });

        const data = await response.json();

        if (data.success) {
          const appliedEntry = data.applicationRecord || {
            applicationId: data.applicationId,
            appliedAt: data.appliedAt,
            job: job,
            candidate: profile,
            recipientEmail: hrEmail,
            coverLetter: els.applicantCoverLetter.value,
            companyResult: { messageId: data.messageId, previewUrl: data.previewUrl, delivered: true },
            candidateResult: { sent: data.candidateConfirmationSent, previewUrl: data.candidatePreviewUrl },
            previewUrl: data.previewUrl,
            resumeFilename: data.details?.resumeFilename || 'Resume.pdf'
          };

          // Update application state and local storage
          state.appliedJobs = state.appliedJobs.filter(a => a.applicationId !== appliedEntry.applicationId);
          state.appliedJobs.unshift(appliedEntry);
          localStorage.setItem('remote_job_agent_applied', JSON.stringify(state.appliedJobs));

          state._lastSubmittedCoverLetter = els.applicantCoverLetter.value;

          if (els.autoApplyForm) els.autoApplyForm.style.display = 'none';
          if (els.applyProgressCard) els.applyProgressCard.style.display = 'none';
          if (els.applySuccessCard) els.applySuccessCard.style.display = 'block';
          if (els.applySuccessMsg) els.applySuccessMsg.textContent = `Your resume and tailored cover letter were emailed to ${job.company} on your behalf!`;
          if (els.applySuccessCode) els.applySuccessCode.textContent = `Ref: ${data.applicationId}`;

          // Update Company HR Delivery Card
          if (els.companyDeliveryEmail) els.companyDeliveryEmail.textContent = hrEmail;
          if (els.companyPreviewContainer) {
            if (data.previewUrl) {
              els.companyPreviewContainer.style.display = 'block';
              if (els.companyPreviewLink) els.companyPreviewLink.href = data.previewUrl;
            } else {
              els.companyPreviewContainer.style.display = 'none';
            }
          }

          // Update Applicant Copy Delivery Card
          if (els.candidateDeliveryEmail) els.candidateDeliveryEmail.textContent = profile.email || 'None';
          if (els.candidateDeliveryBadge) {
            els.candidateDeliveryBadge.textContent = data.candidateConfirmationSent ? 'Delivered 🟢' : 'Skipped ⚪';
          }
          if (els.candidatePreviewContainer) {
            if (data.candidatePreviewUrl) {
              els.candidatePreviewContainer.style.display = 'block';
              if (els.candidatePreviewLink) els.candidatePreviewLink.href = data.candidatePreviewUrl;
            } else {
              els.candidatePreviewContainer.style.display = 'none';
            }
          }

          if (els.tabAppliedCount) {
            els.tabAppliedCount.textContent = state.appliedJobs.length;
          }
        } else {
          throw new Error(data.error || 'Failed to dispatch email application');
        }
      } catch (err) {
        if (els.applyProgressCard) els.applyProgressCard.style.display = 'none';
        showError('Auto-Apply Email Failed', err.message);
      }
    }, 700);
  }

  // ─── Tab Events ───────────────────────────────────────────────────────────
  function bindTabEvents() {
    if (els.tabWorldwide) els.tabWorldwide.addEventListener('click', () => switchTab('worldwide'));
    if (els.tabIndia) els.tabIndia.addEventListener('click', () => switchTab('india'));
    if (els.tabGlobal) els.tabGlobal.addEventListener('click', () => switchTab('global'));
    if (els.tabApplied) els.tabApplied.addEventListener('click', () => switchTab('applied'));
  }

  function switchTab(tab) {
    state.activeTab = tab;
    saveAppState();

    if (els.tabWorldwide) els.tabWorldwide.classList.toggle('active', tab === 'worldwide');
    if (els.tabIndia) els.tabIndia.classList.toggle('active', tab === 'india');
    if (els.tabGlobal) els.tabGlobal.classList.toggle('active', tab === 'global');
    if (els.tabApplied) els.tabApplied.classList.toggle('active', tab === 'applied');

    renderJobList();
  }

  // ─── Filter Events & Modal (Adaptive Desktop Inline / Mobile Modal) ──────
  function bindFilterEvents() {
    function updateActiveFilterBadge() {
      let count = 0;
      if (state.sortBy && state.sortBy !== 'match') count++;
      if (state.minMatch && state.minMatch > 0) count++;
      if (state.remoteType && state.remoteType !== 'all') count++;
      if (state.countryScope && state.countryScope !== 'all') count++;
      if (state.dateRange && String(state.dateRange) !== '30') count++;

      if (els.activeFilterBadge) {
        if (count > 0) {
          els.activeFilterBadge.textContent = count;
          els.activeFilterBadge.style.display = 'inline-block';
        } else {
          els.activeFilterBadge.style.display = 'none';
        }
      }
      if (els.resetFiltersBtn) {
        els.resetFiltersBtn.style.display = count > 0 ? 'inline-flex' : 'none';
      }
    }

    const closeFilterModal = () => {
      if (els.filtersModalOverlay) els.filtersModalOverlay.style.display = 'none';
    };

    // Desktop Inline Filter Change Listeners (Instant 1-Click Filtering on Desktop)
    const bindDesktopFilterChange = (el, stateKey, isInt = false, isDate = false) => {
      if (!el) return;
      el.addEventListener('change', () => {
        const val = isInt ? parseInt(el.value, 10) : el.value;
        const prevDate = state.dateRange;
        state[stateKey] = val;

        // Sync to modal select
        if (stateKey === 'sortBy' && els.modalSortSelect) els.modalSortSelect.value = val;
        if (stateKey === 'minMatch' && els.modalMinMatchSelect) els.modalMinMatchSelect.value = String(val);
        if (stateKey === 'remoteType' && els.modalRemoteTypeSelect) els.modalRemoteTypeSelect.value = val;
        if (stateKey === 'countryScope' && els.modalCountryScopeSelect) els.modalCountryScopeSelect.value = val;
        if (stateKey === 'dateRange' && els.modalDateRangeSelect) els.modalDateRangeSelect.value = String(val);

        updateActiveFilterBadge();

        if (isDate && prevDate !== undefined && prevDate !== val && state.resumeData) {
          searchJobs();
        } else {
          renderJobList();
        }
      });
    };

    bindDesktopFilterChange(els.sortSelect, 'sortBy');
    bindDesktopFilterChange(els.minMatchSelect, 'minMatch', true);
    bindDesktopFilterChange(els.remoteTypeSelect, 'remoteType');
    bindDesktopFilterChange(els.countryScopeSelect, 'countryScope');
    bindDesktopFilterChange(els.dateRangeSelect, 'dateRange', true, true);

    // Open Mobile Filter Modal
    if (els.openFiltersModalBtn) {
      els.openFiltersModalBtn.addEventListener('click', () => {
        if (els.modalSortSelect) els.modalSortSelect.value = state.sortBy || 'match';
        if (els.modalMinMatchSelect) els.modalMinMatchSelect.value = String(state.minMatch || 0);
        if (els.modalRemoteTypeSelect) els.modalRemoteTypeSelect.value = state.remoteType || 'all';
        if (els.modalCountryScopeSelect) els.modalCountryScopeSelect.value = state.countryScope || 'all';
        if (els.modalDateRangeSelect) els.modalDateRangeSelect.value = String(state.dateRange || 30);
        if (els.filtersModalOverlay) els.filtersModalOverlay.style.display = 'flex';
      });
    }

    // Close & Cancel buttons
    if (els.closeFiltersModalBtn) els.closeFiltersModalBtn.addEventListener('click', closeFilterModal);
    if (els.cancelFiltersModalBtn) els.cancelFiltersModalBtn.addEventListener('click', closeFilterModal);
    if (els.filtersModalOverlay) {
      els.filtersModalOverlay.addEventListener('click', (e) => {
        if (e.target === els.filtersModalOverlay) closeFilterModal();
      });
    }

    // Apply filters from Mobile Modal
    if (els.applyFiltersBtn) {
      els.applyFiltersBtn.addEventListener('click', () => {
        const prevDate = state.dateRange;
        const newDate = els.modalDateRangeSelect ? parseInt(els.modalDateRangeSelect.value, 10) : 30;

        state.sortBy = els.modalSortSelect?.value || 'match';
        state.minMatch = parseInt(els.modalMinMatchSelect?.value || '0', 10);
        state.remoteType = els.modalRemoteTypeSelect?.value || 'all';
        state.countryScope = els.modalCountryScopeSelect?.value || 'all';
        state.dateRange = newDate;

        // Sync to desktop selects
        if (els.sortSelect) els.sortSelect.value = state.sortBy;
        if (els.minMatchSelect) els.minMatchSelect.value = String(state.minMatch);
        if (els.remoteTypeSelect) els.remoteTypeSelect.value = state.remoteType;
        if (els.countryScopeSelect) els.countryScopeSelect.value = state.countryScope;
        if (els.dateRangeSelect) els.dateRangeSelect.value = String(newDate);

        updateActiveFilterBadge();
        closeFilterModal();

        if (prevDate !== undefined && prevDate !== newDate && state.resumeData) {
          searchJobs();
        } else {
          renderJobList();
        }
      });
    }

    // Debounced live text search
    let searchTimeout;
    if (els.searchInput) {
      els.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.searchQuery = e.target.value;
          renderJobList();
        }, 150);
      });
    }

    // Reset all filters
    const handleResetFilters = (e) => {
      if (e) e.preventDefault();
      const prevDate = state.dateRange;

      state.sortBy = 'match';
      state.minMatch = 0;
      state.remoteType = 'all';
      state.countryScope = 'all';
      state.dateRange = 30;

      if (els.sortSelect) els.sortSelect.value = 'match';
      if (els.minMatchSelect) els.minMatchSelect.value = '0';
      if (els.remoteTypeSelect) els.remoteTypeSelect.value = 'all';
      if (els.countryScopeSelect) els.countryScopeSelect.value = 'all';
      if (els.dateRangeSelect) els.dateRangeSelect.value = '30';

      if (els.modalSortSelect) els.modalSortSelect.value = 'match';
      if (els.modalMinMatchSelect) els.modalMinMatchSelect.value = '0';
      if (els.modalRemoteTypeSelect) els.modalRemoteTypeSelect.value = 'all';
      if (els.modalCountryScopeSelect) els.modalCountryScopeSelect.value = 'all';
      if (els.modalDateRangeSelect) els.modalDateRangeSelect.value = '30';

      updateActiveFilterBadge();
      closeFilterModal();

      if (prevDate !== undefined && prevDate !== 30 && state.resumeData) {
        searchJobs();
      } else {
        renderJobList();
      }
    };

    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.addEventListener('click', handleResetFilters);
    }
    if (els.modalResetFiltersBtn) {
      els.modalResetFiltersBtn.addEventListener('click', handleResetFilters);
    }
  }

  // ─── Misc Events ──────────────────────────────────────────────────────────
  function bindMiscEvents() {
    // Reusable keyword search executor
    const performKeywordSearch = (rawText) => {
      const val = (rawText || '').trim();
      if (!val) return;

      // Deduplicate direct search keywords
      const seenKws = new Set();
      const keywords = [];
      val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).forEach(k => {
        const lower = k.toLowerCase();
        if (!seenKws.has(lower)) {
          seenKws.add(lower);
          keywords.push(k);
        }
      });

      if (keywords.length === 0) return;

      // Cleanly create fresh resumeData with ONLY the new keywords
      state.resumeData = {
        fileName: 'Direct Search: ' + keywords.join(', '),
        experience: { label: 'Custom Keywords', level: 'all' },
        skills: { count: keywords.length, all: keywords, byCategory: {} },
        titles: keywords.slice(0, 3),
        keywords: keywords
      };

      // Reset live filters, stale inputs and localStorage caches
      state.searchMode = 'keyword';
      state.searchQuery = '';
      if (els.searchInput) els.searchInput.value = '';
      if (els.topSearchInput) els.topSearchInput.value = keywords.join(', ');
      if (els.topSearchClearBtn) els.topSearchClearBtn.style.display = 'block';
      state.results = null;
      localStorage.removeItem('remote_job_agent_resume');
      localStorage.removeItem('remote_job_agent_results');

      // If searched by keyword, application profile & resume analysis and upload section should NOT be visible
      if (els.resumeSection) els.resumeSection.style.display = 'none';
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) uploadSection.style.display = 'none';

      searchJobs();
    };

    // Hero direct keyword search form
    const directForm = $('#direct-search-form');
    const handleDirectSearch = (e) => {
      if (e) e.preventDefault();
      const val = (els.directKeywordInput?.value || '').trim();
      if (!val) {
        if (els.directKeywordInput) {
          els.directKeywordInput.focus();
          els.directKeywordInput.style.borderColor = '#ef4444';
          setTimeout(() => { els.directKeywordInput.style.borderColor = ''; }, 2000);
        }
        return;
      }
      performKeywordSearch(val);
    };

    if (directForm) {
      directForm.addEventListener('submit', handleDirectSearch);
    } else if (els.directKeywordBtn) {
      els.directKeywordBtn.addEventListener('click', handleDirectSearch);
    }

    // Top persistent keyword search form (in post-search results screen)
    if (els.topSearchForm) {
      els.topSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = (els.topSearchInput?.value || '').trim();
        if (val) {
          performKeywordSearch(val);
        }
      });
    }

    if (els.topSearchClearBtn) {
      els.topSearchClearBtn.addEventListener('click', () => {
        if (els.topSearchInput) {
          els.topSearchInput.value = '';
          els.topSearchInput.focus();
        }
        els.topSearchClearBtn.style.display = 'none';
      });
    }

    if (els.topSearchInput) {
      els.topSearchInput.addEventListener('input', (e) => {
        if (els.topSearchClearBtn) {
          els.topSearchClearBtn.style.display = e.target.value.trim() ? 'block' : 'none';
        }
      });
    }

    // Switch to resume upload mode from top search bar
    if (els.topSwitchResumeBtn) {
      els.topSwitchResumeBtn.addEventListener('click', () => {
        expandUploadSection();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Logo click returns to clean home state
    if (els.logo) {
      els.logo.style.cursor = 'pointer';
      els.logo.addEventListener('click', () => {
        expandUploadSection();
        if (els.resumeSection) els.resumeSection.style.display = 'none';
        if (els.resultsSection) els.resultsSection.style.display = 'none';
        const alertSection = document.getElementById('alert-section');
        if (alertSection) alertSection.style.display = 'none';
        if (els.headerStats) els.headerStats.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Custom keyword update re-search button
    if (els.updateKeywordsSearchBtn) {
      els.updateKeywordsSearchBtn.addEventListener('click', () => {
        const val = (els.customKeywordsInput?.value || '').trim();
        if (!val) return;

        // Deduplicate entered keywords case-insensitively
        const seen = new Set();
        const newKeywords = [];
        val.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).forEach(k => {
          const lower = k.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            newKeywords.push(k);
          }
        });

        if (!state.resumeData) {
          state.resumeData = {
            fileName: 'Keywords: ' + newKeywords.join(', '),
            experience: { label: 'Custom Keywords', level: 'all' },
            skills: { count: newKeywords.length, all: newKeywords, byCategory: {} },
            titles: newKeywords.slice(0, 3),
            keywords: newKeywords
          };
        } else {
          // Update filename label if not an actual uploaded resume file
          if (!state.resumeData.fileName?.includes('.pdf') && !state.resumeData.fileName?.includes('.docx')) {
            state.resumeData.fileName = 'Keywords: ' + newKeywords.join(', ');
          }
          // Replace keywords with the newly entered unique keywords
          state.resumeData.keywords = newKeywords;
          state.resumeData.skills = { count: newKeywords.length, all: newKeywords, byCategory: {} };
          state.resumeData.titles = newKeywords.slice(0, 3);
        }

        // Sync both search input bars
        if (els.customKeywordsInput) {
          els.customKeywordsInput.value = newKeywords.join(', ');
        }
        if (els.directKeywordInput) {
          els.directKeywordInput.value = newKeywords.join(', ');
        }

        // Re-render all summary cards, counters, chips and titles across the UI
        displayResumeSummary(state.resumeData);

        // Reset live in-page filter
        state.searchQuery = '';
        if (els.searchInput) els.searchInput.value = '';

        searchJobs();
      });
    }

    // Change resume button
    els.changeResumeBtn.addEventListener('click', () => {
      localStorage.removeItem('remote_job_agent_candidate');
      localStorage.removeItem('remote_job_agent_resume');
      localStorage.removeItem('remote_job_agent_results');
      expandUploadSection();
      els.resumeSection.style.display = 'none';
      if (els.searchingModalOverlay) els.searchingModalOverlay.style.display = 'none';
      els.resultsSection.style.display = 'none';
      const alertSection = document.getElementById('alert-section');
      if (alertSection) alertSection.style.display = 'none';
      els.headerStats.style.display = 'none';
      state.resumeData = null;
      state.results = null;
      state.candidateProfile = {};
      updateCandidateProfileDisplay();
      state.searchQuery = '';
      if (els.searchInput) els.searchInput.value = '';
      if (els.directKeywordInput) els.directKeywordInput.value = '';
      if (els.customKeywordsInput) els.customKeywordsInput.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Error retry
    els.errorRetryBtn.addEventListener('click', () => {
      hideError();
      if (state.resumeData) {
        searchJobs();
      } else {
        resetUpload();
      }
    });
  }

  // ─── Error Handling ───────────────────────────────────────────────────────
  function showError(title, message) {
    els.errorSection.style.display = 'block';
    els.errorTitle.textContent = title;
    els.errorMessage.textContent = message;
    els.errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    els.errorSection.style.display = 'none';
  }

  // ─── Reset Upload ─────────────────────────────────────────────────────────
  function resetUpload() {
    els.uploadArea.style.display = 'block';
    els.uploadProgress.style.display = 'none';
    els.fileInput.value = '';
    hideError();
  }

  // ─── Utility Functions ────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen).trim() + '...';
  }

  function getCompanyInitials(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function getCompanyColor(name) {
    if (!name) return '#6366f1';
    // Generate a deterministic color from company name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 45%)`;
  }

  // ─── Start App ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
