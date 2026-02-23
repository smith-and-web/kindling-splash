 (function() {
   // Google Ads conversion ID - set when Ads account is configured
   // window.GOOGLE_ADS_CONVERSION_ID = 'AW-XXXXXXXX/XXXXXXXX';

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
       if (ua.includes('arm') || ua.includes('aarch64') || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS')) {
         return 'mac-arm';
       }
       return 'mac-intel';
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
         gtag('event', 'email_signup_confirmed', {
           event_category: 'conversion',
           event_label: 'newsletter'
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
 
 document.addEventListener('DOMContentLoaded', function() {
   initMobileNav();
   highlightDownloadButtons();
   trackSignupForms();
   trackOutboundLinks();
 });
 })();
