/* kindling Press website behaviors, v0.2.0.
   Classic-script compatible for file:// use; also importable for side effects.
   Public API: window.KindlingWebsite.init(scope), destroy(scope).
   No requests, analytics, clipboard access, downloads or form submissions. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.KindlingWebsite) return;
  const bindings = new WeakMap();
  const selector = '[data-pw-nav], [data-pw-beats], [data-pw-platform], [data-pw-signup]';
  function nodes(scope) {
    const found = [...scope.querySelectorAll(selector)];
    if (scope.matches && scope.matches(selector)) found.unshift(scope);
    return found.filter(node => node.closest('.press-web'));
  }
  function init(scope = document) {
    nodes(scope).forEach(node => {
      if (bindings.has(node)) return;
      const controller = new AbortController();
      const on = (target,event,handler) => target.addEventListener(event,handler,{signal:controller.signal});
      let reset = () => {};
      if (node.matches('[data-pw-nav]')) {
        const toggle = node.querySelector('[data-pw-menu]');
        const menu = node.querySelector('[data-pw-links]');
        if (!toggle || !menu) return;
        const close = (restore = false) => {node.removeAttribute('data-open');toggle.setAttribute('aria-expanded','false');if(restore)toggle.focus();};
        on(toggle,'click',() => {
          if(node.hasAttribute('data-open')) close(true);
          else {node.setAttribute('data-open','');toggle.setAttribute('aria-expanded','true');menu.querySelector('a[href]')?.focus();}
        });
        on(node,'keydown',event => {if(event.key==='Escape' && node.hasAttribute('data-open')){event.preventDefault();close(true);}});
        on(menu,'click',event => {if(event.target.closest('a[href]'))close();});
        on(document,'pointerdown',event => {if(!node.contains(event.target))close();});
        on(node,'focusout',event => {if(event.relatedTarget && !node.contains(event.relatedTarget))close();});
        reset = () => {close();node.removeAttribute('data-pw-ready');};
        node.setAttribute('data-pw-ready','');
      }
      if (node.matches('[data-pw-beats]')) {
        const choices = [...node.querySelectorAll('input[type="radio"][data-pw-beat]')];
        const panels = [...node.querySelectorAll('[data-pw-draft]')];
        const update = () => {
          const selected=choices.find(input=>input.checked);
          panels.forEach(panel=>{panel.hidden=panel.dataset.pwDraft!==selected?.value;});
        };
        choices.forEach(input=>on(input,'change',update));update();
        reset=()=>panels.forEach(panel=>{panel.hidden=false;});
      }
      if (node.matches('[data-pw-platform]')) {
        const output=node.querySelector('[data-pw-platform-result]');
        const choices=[...node.querySelectorAll('input[type="radio"][data-pw-platform-choice]')];
        const update=()=>{const chosen=choices.find(input=>input.checked);if(output && chosen)output.textContent=chosen.dataset.pwDescription||chosen.value;};
        choices.forEach(input=>on(input,'change',update));update();
      }
      if (node.matches('[data-pw-signup]')) {
        const email=node.querySelector('input[type="email"]');
        const error=node.querySelector('[data-pw-error]');
        const result=node.querySelector('[data-pw-status]');
        const submit=node.querySelector('button[type="submit"]');
        if(!email||!error||!result||!submit)return;
        let timer;
        const label=submit.textContent;
        const validate=()=>{
          let message='';
          if(!email.value.trim())message='Enter your email address to continue.';
          else if(!email.validity.valid)message='Use an email address like name@example.com.';
          error.textContent=message;error.hidden=!message;email.setAttribute('aria-invalid',String(Boolean(message)));
          return !message;
        };
        on(email,'blur',validate);
        on(node,'submit',event=>{
          event.preventDefault();result.textContent='';
          if(!validate()){email.focus();return;}
          submit.disabled=true;submit.textContent='Checking…';email.readOnly=true;result.textContent='Checking this example locally…';
          timer=window.setTimeout(()=>{
            result.textContent='Example complete. Your address was not sent or stored.';
            submit.disabled=false;submit.textContent=label;email.readOnly=false;
          },450);
        });
        reset=()=>{clearTimeout(timer);submit.disabled=false;submit.textContent=label;email.readOnly=false;};
      }
      bindings.set(node,()=>{controller.abort();reset();bindings.delete(node);});
    });
  }
  function destroy(scope=document){nodes(scope).forEach(node=>bindings.get(node)?.());}
  window.KindlingWebsite=Object.freeze({init,destroy});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
})();
