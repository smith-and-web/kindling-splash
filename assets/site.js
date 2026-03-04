 (function() {

   function getDownloadContext() {
     if (!document.body) {
       return '';
     }
     return document.body.getAttribute('data-download-context') || '';
   }
 
   window.trackDownload = function(platform) {
     if (typeof gtag !== 'function') {
       return;
     }
 
     var context = getDownloadContext();
     var label = context ? platform + '_' + context : platform;
 
     gtag('event', 'download', {
       event_category: 'engagement',
       event_label: label,
       value: 1
     });
   };
 
   function detectPlatform() {
     var ua = navigator.userAgent.toLowerCase();
     var platform = (navigator.platform || '').toLowerCase();

     if (platform.includes('mac') || ua.includes('mac')) {
       return 'mac';
     }
 
     if (platform.includes('win') || ua.includes('win')) {
       return 'windows';
     }
 
     if (platform.includes('linux') || ua.includes('linux')) {
       return 'linux';
     }
 
     return null;
   }
 
   function highlightDownloadButtons() {
     var detectedPlatform = detectPlatform();
     if (!detectedPlatform) {
       return;
     }

     document.querySelectorAll('.download-buttons').forEach(function(container) {
       var buttons = container.querySelectorAll('.download-btn');
       buttons.forEach(function(btn) {
         var btnPlatform = btn.getAttribute('data-platform');
         if (!btnPlatform) return;
         btn.classList.add('secondary');
         if (btnPlatform === detectedPlatform) {
           btn.classList.remove('secondary');
         }
       });
     });

     document.querySelectorAll('.download-cards').forEach(function(container) {
       var cards = container.querySelectorAll('.download-card-large');
       cards.forEach(function(card) {
         var platform = card.getAttribute('data-platform');
         if (!platform) return;
         card.classList.remove('highlight');
         if (platform === detectedPlatform) {
           card.classList.add('highlight');
         }
       });
     });
   }
 
   function trackSignupForms() {
     document.querySelectorAll('.signup-form').forEach(function(form) {
       form.addEventListener('submit', function() {
         if (typeof gtag !== 'function') {
           return;
         }

         gtag('event', 'email_signup', {
           event_category: 'engagement',
           event_label: 'newsletter_form'
         });
       });
     });
   }
 
   function initMobileNav() {
   var toggle = document.querySelector('.navbar-toggle');
   var navbar = document.querySelector('.navbar');
   if (!toggle || !navbar) return;

   toggle.addEventListener('click', function() {
     var isOpen = navbar.classList.toggle('navbar-open');
     toggle.setAttribute('aria-expanded', isOpen);
     document.body.style.overflow = isOpen ? 'hidden' : '';
   });

   function closeMenu() {
     navbar.classList.remove('navbar-open');
     toggle.setAttribute('aria-expanded', 'false');
     document.body.style.overflow = '';
   }

   navbar.querySelectorAll('.navbar-link, .navbar-cta').forEach(function(link) {
     link.addEventListener('click', closeMenu);
   });

   document.addEventListener('click', function(e) {
     if (navbar.classList.contains('navbar-open') && !navbar.contains(e.target)) {
       closeMenu();
     }
   });
 }

 function trackOutboundLinks() {
     document.querySelectorAll('a[href^="http"]').forEach(function(link) {
       if (link.href.includes('kindlingwriter.com')) {
         return;
       }
 
       link.addEventListener('click', function() {
         if (typeof gtag !== 'function') {
           return;
         }
 
         gtag('event', 'click', {
           event_category: 'outbound',
           event_label: link.href,
           transport_type: 'beacon'
         });
       });
     });
   }
 
 // ===== Feedback Bubble & Popup =====
 var FEEDBACK_API_URL = 'https://2gcszmyn325n5yaey2poh72qbe0tkmre.lambda-url.ca-central-1.on.aws/';

 function initFeedbackBubble() {
   // Don't show on the /feedback/ page itself
   var path = window.location.pathname;
   if (path === '/feedback/' || path === '/feedback') return;

   // Add mobile nav link (before the Download CTA)
   var navLinks = document.querySelector('.navbar-links');
   if (navLinks) {
     var cta = navLinks.querySelector('.navbar-cta');
     var mobileLink = document.createElement('a');
     mobileLink.href = '/feedback/';
     mobileLink.className = 'navbar-link feedback-mobile-link';
     mobileLink.textContent = 'Feedback';
     if (cta) {
       navLinks.insertBefore(mobileLink, cta);
     } else {
       navLinks.appendChild(mobileLink);
     }
   }

   // Build bubble button
   var bubble = document.createElement('button');
   bubble.className = 'feedback-bubble-btn';
   bubble.setAttribute('aria-label', 'Send feedback');
   bubble.setAttribute('type', 'button');
   bubble.innerHTML =
     '<svg class="fb-icon-chat" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
       '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />' +
     '</svg>' +
     '<svg class="fb-icon-close" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
       '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />' +
     '</svg>';

   // Build popup
   var popup = document.createElement('div');
   popup.className = 'feedback-popup';
   popup.innerHTML =
     '<div class="feedback-popup-header">' +
       '<h3>Send Feedback</h3>' +
       '<button class="feedback-popup-close" type="button" aria-label="Close feedback">' +
         '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
           '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />' +
         '</svg>' +
       '</button>' +
     '</div>' +
     '<div class="feedback-popup-body">' +
       '<div class="fbp-tabs">' +
         '<button type="button" class="active" data-type="bug">\uD83D\uDC1B Bug</button>' +
         '<button type="button" data-type="feature">\uD83D\uDCA1 Feature</button>' +
         '<button type="button" data-type="rating">\u2B50 Rate</button>' +
       '</div>' +
       // Bug section
       '<div class="fbp-section visible" data-section="bug">' +
         '<div class="fbp-form-group">' +
           '<label>Summary <span class="fbp-required">*</span></label>' +
           '<input type="text" id="fbp-bug-summary" maxlength="120" placeholder="Briefly describe the issue">' +
         '</div>' +
         '<div class="fbp-form-group">' +
           '<label>What happened? <span class="fbp-required">*</span></label>' +
           '<textarea id="fbp-bug-desc" maxlength="2000" rows="3" placeholder="Describe what went wrong"></textarea>' +
         '</div>' +
       '</div>' +
       // Feature section
       '<div class="fbp-section" data-section="feature">' +
         '<div class="fbp-form-group">' +
           '<label>Feature title <span class="fbp-required">*</span></label>' +
           '<input type="text" id="fbp-feature-title" maxlength="120" placeholder="Name the feature">' +
         '</div>' +
         '<div class="fbp-form-group">' +
           '<label>Description <span class="fbp-required">*</span></label>' +
           '<textarea id="fbp-feature-desc" maxlength="2000" rows="3" placeholder="What should this feature do?"></textarea>' +
         '</div>' +
       '</div>' +
       // Rating section
       '<div class="fbp-section" data-section="rating">' +
         '<div class="fbp-form-group">' +
           '<label>How would you rate Kindling?</label>' +
           '<div class="fbp-stars" id="fbp-stars"></div>' +
         '</div>' +
         '<div class="fbp-form-group">' +
           '<label>Any thoughts?</label>' +
           '<textarea id="fbp-rating-comment" maxlength="2000" rows="3" placeholder="Optional"></textarea>' +
         '</div>' +
       '</div>' +
       // Shared: email
       '<div class="fbp-form-group">' +
         '<label>Email (optional)</label>' +
         '<input type="email" id="fbp-email" placeholder="Only if you\'d like a reply">' +
       '</div>' +
       // Honeypot
       '<div style="position:absolute;left:-9999px" aria-hidden="true">' +
         '<input type="text" id="fbp-honeypot" tabindex="-1" autocomplete="off">' +
       '</div>' +
       '<button type="button" class="fbp-submit" id="fbp-submit">Send Feedback</button>' +
       '<div class="fbp-status" id="fbp-status"></div>' +
       '<p class="fbp-privacy">Anonymous. <a href="/privacy/">Privacy policy</a></p>' +
     '</div>';

   document.body.appendChild(popup);
   document.body.appendChild(bubble);

   // State
   var fbpType = 'bug';
   var fbpRating = 0;
   var fbpOpenedAt = new Date().toISOString();
   var isOpen = false;

   // Build star buttons
   var starContainer = popup.querySelector('#fbp-stars');
   for (var i = 1; i <= 5; i++) {
     var star = document.createElement('button');
     star.type = 'button';
     star.textContent = '\u2606';
     star.dataset.value = i;
     star.setAttribute('aria-label', i + ' star' + (i > 1 ? 's' : ''));
     (function(val) {
       star.addEventListener('click', function() {
         fbpRating = val;
         starContainer.querySelectorAll('button').forEach(function(s, idx) {
           s.textContent = idx < val ? '\u2605' : '\u2606';
           s.classList.toggle('active', idx < val);
         });
       });
     })(i);
     starContainer.appendChild(star);
   }

   // Open/close toggle
   function openPopup() {
     isOpen = true;
     bubble.classList.add('is-open');
     popup.classList.add('is-visible');
     // Trigger animation in next frame
     requestAnimationFrame(function() {
       requestAnimationFrame(function() {
         popup.classList.add('is-active');
       });
     });
     fbpOpenedAt = new Date().toISOString();
   }

   function closePopup() {
     isOpen = false;
     bubble.classList.remove('is-open');
     popup.classList.remove('is-active');
     // Wait for transition to finish, then hide
     setTimeout(function() {
       if (!isOpen) popup.classList.remove('is-visible');
     }, 220);
   }

   bubble.addEventListener('click', function() {
     if (isOpen) {
       closePopup();
     } else {
       openPopup();
     }
   });

   popup.querySelector('.feedback-popup-close').addEventListener('click', closePopup);

   // Close on Escape
   document.addEventListener('keydown', function(e) {
     if (e.key === 'Escape' && isOpen) closePopup();
   });

   // Tab switching
   popup.querySelectorAll('.fbp-tabs button').forEach(function(tab) {
     tab.addEventListener('click', function() {
       popup.querySelectorAll('.fbp-tabs button').forEach(function(t) { t.classList.remove('active'); });
       tab.classList.add('active');
       fbpType = tab.dataset.type;

       popup.querySelectorAll('.fbp-section').forEach(function(s) { s.classList.remove('visible'); });
       popup.querySelector('.fbp-section[data-section="' + fbpType + '"]').classList.add('visible');

       // Reset status
       var statusEl = popup.querySelector('#fbp-status');
       statusEl.className = 'fbp-status';
       fbpOpenedAt = new Date().toISOString();
     });
   });

   // Submit
   popup.querySelector('#fbp-submit').addEventListener('click', function() {
     var submitBtn = popup.querySelector('#fbp-submit');
     var statusEl = popup.querySelector('#fbp-status');

     var payload = {
       type: fbpType,
       source: 'website_popup',
       os: detectPopupOS(),
       appVersion: 'website',
       locale: navigator.language,
       website: popup.querySelector('#fbp-honeypot').value,
       formOpenedAt: fbpOpenedAt
     };

     var email = popup.querySelector('#fbp-email').value.trim();
     if (email) payload.email = email;

     if (fbpType === 'bug') {
       payload.summary = popup.querySelector('#fbp-bug-summary').value.trim();
       payload.message = popup.querySelector('#fbp-bug-desc').value.trim();
       if (!payload.summary || !payload.message) {
         showPopupStatus(statusEl, 'Please fill in all required fields.', 'error');
         return;
       }
     } else if (fbpType === 'feature') {
       payload.summary = popup.querySelector('#fbp-feature-title').value.trim();
       payload.message = popup.querySelector('#fbp-feature-desc').value.trim();
       if (!payload.summary || !payload.message) {
         showPopupStatus(statusEl, 'Please fill in all required fields.', 'error');
         return;
       }
     } else if (fbpType === 'rating') {
       if (fbpRating === 0) {
         showPopupStatus(statusEl, 'Please select a star rating.', 'error');
         return;
       }
       payload.rating = fbpRating;
       payload.message = popup.querySelector('#fbp-rating-comment').value.trim();
       payload.summary = fbpRating + '-star rating';
     }

     submitBtn.disabled = true;
     submitBtn.textContent = 'Sending...';

     fetch(FEEDBACK_API_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     })
     .then(function(response) {
       if (response.ok) {
         showPopupStatus(statusEl, 'Thank you! Your feedback has been received.', 'success');
         resetPopupForm(popup, starContainer);
         // Track in GA
         if (typeof gtag === 'function') {
           gtag('event', 'feedback_submitted', {
             event_category: 'engagement',
             event_label: fbpType + '_popup'
           });
         }
       } else if (response.status === 429) {
         showPopupStatus(statusEl, 'Too many submissions. Please try again later.', 'error');
       } else {
         response.json().catch(function() { return {}; }).then(function(data) {
           showPopupStatus(statusEl, data.error || 'Something went wrong. Please try again.', 'error');
         });
       }
     })
     .catch(function() {
       showPopupStatus(statusEl, 'Network error. Please check your connection.', 'error');
     })
     .finally(function() {
       submitBtn.disabled = false;
       submitBtn.textContent = 'Send Feedback';
     });
   });

   // Track bubble open in GA
   bubble.addEventListener('click', function() {
     if (typeof gtag === 'function' && isOpen) {
       gtag('event', 'feedback_opened', {
         event_category: 'engagement',
         event_label: 'bubble_popup'
       });
     }
   });
 }

 function detectPopupOS() {
   var ua = navigator.userAgent.toLowerCase();
   if (ua.includes('mac')) return 'macos';
   if (ua.includes('win')) return 'windows';
   if (ua.includes('linux')) return 'linux';
   return 'unknown';
 }

 function showPopupStatus(el, message, type) {
   el.textContent = message;
   el.className = 'fbp-status visible ' + type;
 }

 function resetPopupForm(popup, starContainer) {
   popup.querySelectorAll('.fbp-section input[type="text"], .fbp-section textarea').forEach(function(el) {
     el.value = '';
   });
   popup.querySelector('#fbp-email').value = '';
   // Reset stars
   starContainer.querySelectorAll('button').forEach(function(s) {
     s.textContent = '\u2606';
     s.classList.remove('active');
   });
 }

 document.addEventListener('DOMContentLoaded', function() {
   initMobileNav();
   highlightDownloadButtons();
   trackSignupForms();
   trackOutboundLinks();
   initFeedbackBubble();
 });
 })();
