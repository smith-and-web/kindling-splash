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
       if (ua.includes('arm') || (window.navigator.userAgentData && window.navigator.userAgentData.platform === 'macOS')) {
         return 'mac-arm';
       }
       return 'mac-arm';
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
        if (!btnPlatform) {
          return;
        }

        btn.classList.add('secondary');
 
         if (btnPlatform === detectedPlatform) {
           btn.classList.remove('secondary');
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
     highlightDownloadButtons();
     trackSignupForms();
     trackOutboundLinks();
   });
 })();
