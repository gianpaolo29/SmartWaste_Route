import Swal from 'sweetalert2';

const BRAND = '#059669';   // emerald-600
const CANCEL = '#6b7280';  // gray-500

// ── Toasts ──────────────────────────────────────────────────────────────────
export const toast = (icon: 'success' | 'error' | 'info' | 'warning', title: string) =>
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
    });

// ── Confirm (question) ─────────────────────────────────────────────────────
export const confirm = async (title: string, text?: string, confirmText = 'Yes') => {
    const r = await Swal.fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: BRAND,
        cancelButtonColor: CANCEL,
        confirmButtonText: confirmText,
        reverseButtons: true,
    });
    return r.isConfirmed;
};

// ── Question shorthand (same as confirm but named clearly) ──────────────────
export const question = confirm;

// ── Info confirm ────────────────────────────────────────────────────────────
export const infoConfirm = async (title: string, text?: string, confirmText = 'Continue', cancelText = 'Cancel') => {
    const r = await Swal.fire({
        icon: 'info',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: BRAND,
        cancelButtonColor: CANCEL,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
    });
    return r.isConfirmed;
};

// ── Loading with premium truck animation ───────────────────────────────────
const truckHtml = `
<div style="display:flex;flex-direction:column;align-items:center;padding:4px 0 0;overflow:hidden">

  <!-- Scenic backdrop -->
  <div style="position:relative;width:280px;height:130px;border-radius:16px;background:linear-gradient(180deg,#ecfdf5 0%,#d1fae5 40%,#a7f3d0 100%);overflow:hidden">

    <!-- Sun -->
    <div style="position:absolute;top:14px;right:28px;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,#fde68a 40%,#fbbf24 100%);box-shadow:0 0 20px 6px rgba(251,191,36,0.25);animation:swal-sun-pulse 3s ease-in-out infinite"></div>

    <!-- Clouds -->
    <div style="position:absolute;top:16px;animation:swal-cloud 8s linear infinite">
      <svg width="48" height="20" viewBox="0 0 48 20" fill="none"><ellipse cx="24" cy="14" rx="20" ry="6" fill="white" opacity="0.7"/><ellipse cx="18" cy="10" rx="10" ry="6" fill="white" opacity="0.8"/><ellipse cx="32" cy="10" rx="12" ry="7" fill="white" opacity="0.75"/></svg>
    </div>
    <div style="position:absolute;top:28px;animation:swal-cloud 12s linear 4s infinite">
      <svg width="36" height="16" viewBox="0 0 36 16" fill="none"><ellipse cx="18" cy="10" rx="16" ry="5" fill="white" opacity="0.5"/><ellipse cx="12" cy="7" rx="8" ry="5" fill="white" opacity="0.6"/><ellipse cx="26" cy="8" rx="9" ry="5" fill="white" opacity="0.55"/></svg>
    </div>

    <!-- Distant hills -->
    <svg style="position:absolute;bottom:28px;left:0;width:100%" viewBox="0 0 280 30" preserveAspectRatio="none">
      <path d="M0 30 Q40 8 80 22 Q120 4 160 18 Q200 2 240 16 Q260 10 280 20 L280 30Z" fill="#6ee7b7" opacity="0.5"/>
      <path d="M0 30 Q50 16 100 24 Q140 12 180 22 Q220 10 260 20 L280 30Z" fill="#6ee7b7" opacity="0.3"/>
    </svg>

    <!-- Ground / grass -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:28px;background:linear-gradient(180deg,#34d399,#059669);border-radius:0 0 16px 16px"></div>

    <!-- Road -->
    <div style="position:absolute;bottom:4px;left:-5%;width:110%;height:16px;background:linear-gradient(180deg,#4b5563,#374151);border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
      <!-- Road centre dashes -->
      <div style="position:absolute;top:50%;transform:translateY(-50%);display:flex;gap:12px;animation:swal-road 0.5s linear infinite">
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
        <i style="display:block;width:16px;height:2px;background:#fbbf24;border-radius:1px;opacity:0.7;flex-shrink:0"></i>
      </div>
      <!-- Road edge lines -->
      <div style="position:absolute;top:2px;left:0;right:0;height:1px;background:white;opacity:0.15"></div>
      <div style="position:absolute;bottom:2px;left:0;right:0;height:1px;background:white;opacity:0.15"></div>
    </div>

    <!-- Small trees -->
    <svg style="position:absolute;bottom:18px;left:12px" width="16" height="28" viewBox="0 0 16 28">
      <rect x="6" y="18" width="4" height="10" rx="1" fill="#92400e"/>
      <ellipse cx="8" cy="12" rx="7" ry="10" fill="#059669"/>
      <ellipse cx="6" cy="10" rx="3" ry="5" fill="#10b981" opacity="0.6"/>
    </svg>
    <svg style="position:absolute;bottom:18px;right:20px" width="14" height="24" viewBox="0 0 14 24">
      <rect x="5" y="16" width="4" height="8" rx="1" fill="#92400e"/>
      <ellipse cx="7" cy="10" rx="6" ry="9" fill="#047857"/>
      <ellipse cx="5" cy="9" rx="2.5" ry="4" fill="#059669" opacity="0.5"/>
    </svg>
    <svg style="position:absolute;bottom:18px;right:56px" width="12" height="20" viewBox="0 0 12 20">
      <rect x="4" y="14" width="3" height="6" rx="1" fill="#92400e"/>
      <ellipse cx="6" cy="9" rx="5" ry="7" fill="#059669"/>
    </svg>

    <!-- Truck -->
    <div style="position:absolute;bottom:14px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.18));animation:swal-truck-drive 4s ease-in-out infinite,swal-truck-bounce 0.5s ease-in-out infinite">
      <svg viewBox="0 0 130 52" width="110" height="45">
        <!-- Exhaust puffs -->
        <circle cx="20" cy="34" r="3" fill="#9ca3af" opacity="0.5">
          <animate attributeName="cx" values="20;6" dur="0.7s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="34;26" dur="0.7s" repeatCount="indefinite"/>
          <animate attributeName="r" values="1.5;5" dur="0.7s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0" dur="0.7s" repeatCount="indefinite"/>
        </circle>
        <circle cx="16" cy="36" r="2" fill="#9ca3af" opacity="0.3">
          <animate attributeName="cx" values="16;4" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="36;28" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
          <animate attributeName="r" values="1;4" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
        </circle>

        <!-- Cargo body -->
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
          <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#065f46"/>
          </linearGradient>
        </defs>
        <rect x="26" y="6" width="58" height="32" rx="4" fill="url(#cg)"/>
        <!-- Cargo panel lines -->
        <line x1="44" y1="8" x2="44" y2="36" stroke="#047857" stroke-width="0.8" opacity="0.4"/>
        <line x1="62" y1="8" x2="62" y2="36" stroke="#047857" stroke-width="0.8" opacity="0.4"/>
        <!-- Recycle emblem -->
        <circle cx="53" cy="20" r="8" fill="#047857" opacity="0.4"/>
        <g transform="translate(53,20)" fill="none" stroke="#d1fae5" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M-1.5-4L0-6L1.5-4"/>
          <path d="M0-6L0-2"/>
          <path d="M2.1 2.3L4 3.4L3.5 5.5"/>
          <path d="M4 3.4L0.5 1.2"/>
          <path d="M-3.6 2.3L-4 4.6L-2 5.5"/>
          <path d="M-4 4.6L-0.5 1.2"/>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite"/>
        </g>
        <!-- Top highlight -->
        <rect x="28" y="7" width="54" height="3" rx="1.5" fill="white" opacity="0.12"/>

        <!-- Cabin -->
        <rect x="84" y="12" width="30" height="26" rx="4" fill="url(#cb)"/>
        <!-- Cabin top highlight -->
        <rect x="86" y="13" width="26" height="3" rx="1.5" fill="white" opacity="0.1"/>
        <!-- Windshield -->
        <rect x="90" y="16" width="18" height="12" rx="3" fill="#bae6fd"/>
        <!-- Windshield reflections -->
        <rect x="91" y="17" width="5" height="10" rx="2" fill="white" opacity="0.25"/>
        <rect x="98" y="17" width="2" height="6" rx="1" fill="white" opacity="0.12"/>
        <!-- Headlight -->
        <rect x="114" y="24" width="4" height="6" rx="2" fill="#fde68a" opacity="0.9"/>
        <rect x="114" y="24" width="4" height="6" rx="2" fill="#fbbf24" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/>
        </rect>

        <!-- Rear bumper -->
        <rect x="24" y="32" width="4" height="6" rx="1" fill="#374151"/>
        <!-- Under-body shadow -->
        <ellipse cx="70" cy="42" rx="36" ry="2" fill="black" opacity="0.08"/>

        <!-- Rear wheel -->
        <circle cx="44" cy="40" r="7" fill="#1f2937"/>
        <circle cx="44" cy="40" r="5" fill="#374151"/>
        <circle cx="44" cy="40" r="2" fill="#6b7280"/>
        <g>
          <line x1="44" y1="34" x2="44" y2="46" stroke="#4b5563" stroke-width="1"/>
          <line x1="38" y1="40" x2="50" y2="40" stroke="#4b5563" stroke-width="1"/>
          <animateTransform attributeName="transform" type="rotate" from="0 44 40" to="360 44 40" dur="0.35s" repeatCount="indefinite"/>
        </g>

        <!-- Front wheel -->
        <circle cx="98" cy="40" r="7" fill="#1f2937"/>
        <circle cx="98" cy="40" r="5" fill="#374151"/>
        <circle cx="98" cy="40" r="2" fill="#6b7280"/>
        <g>
          <line x1="98" y1="34" x2="98" y2="46" stroke="#4b5563" stroke-width="1"/>
          <line x1="92" y1="40" x2="104" y2="40" stroke="#4b5563" stroke-width="1"/>
          <animateTransform attributeName="transform" type="rotate" from="0 98 40" to="360 98 40" dur="0.35s" repeatCount="indefinite"/>
        </g>
      </svg>
    </div>

    <!-- Location pin (pulsing) -->
    <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);animation:swal-pin-float 2s ease-in-out infinite">
      <svg width="22" height="30" viewBox="0 0 22 30">
        <ellipse cx="11" cy="28" rx="5" ry="1.5" fill="black" opacity="0.1">
          <animate attributeName="rx" values="5;3;5" dur="2s" repeatCount="indefinite"/>
        </ellipse>
        <path d="M11 0C5.5 0 1 4.5 1 10c0 7 10 18 10 18s10-11 10-18C21 4.5 16.5 0 11 0z" fill="#dc2626"/>
        <path d="M11 0C5.5 0 1 4.5 1 10c0 7 10 18 10 18" fill="#ef4444" opacity="0.5"/>
        <circle cx="11" cy="10" r="4" fill="white"/>
        <circle cx="11" cy="10" r="2" fill="#dc2626"/>
      </svg>
    </div>
  </div>

  <!-- Dots loader -->
  <div style="display:flex;gap:6px;margin-top:14px">
    <span style="width:6px;height:6px;border-radius:50%;background:#059669;animation:swal-dot 1.2s ease-in-out infinite"></span>
    <span style="width:6px;height:6px;border-radius:50%;background:#059669;animation:swal-dot 1.2s ease-in-out 0.2s infinite"></span>
    <span style="width:6px;height:6px;border-radius:50%;background:#059669;animation:swal-dot 1.2s ease-in-out 0.4s infinite"></span>
  </div>
</div>
<style>
@keyframes swal-truck-drive{0%{left:-35%}50%{left:58%}100%{left:-35%}}
@keyframes swal-truck-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes swal-road{0%{transform:translateX(0) translateY(-50%)}100%{transform:translateX(-28px) translateY(-50%)}}
@keyframes swal-cloud{0%{left:-60px}100%{left:300px}}
@keyframes swal-sun-pulse{0%,100%{box-shadow:0 0 20px 6px rgba(251,191,36,0.25)}50%{box-shadow:0 0 28px 10px rgba(251,191,36,0.35)}}
@keyframes swal-pin-float{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-6px)}}
@keyframes swal-dot{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.5);opacity:1}}
</style>`;

export const loading = (title = 'Please wait…') =>
    Swal.fire({
        title: `<span style="font-size:17px;font-weight:600;color:#1f2937">${title}</span>`,
        html: truckHtml,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        width: 360,
        padding: '1.5em 1.5em 1.2em',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: { popup: 'swal-premium-popup' },
    });

export const closeLoading = () => Swal.close();

// ── Error ───────────────────────────────────────────────────────────────────
export const errorAlert = (title: string, text?: string) =>
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: BRAND });

// ── Success ─────────────────────────────────────────────────────────────────
export const successAlert = (title: string, text?: string) =>
    Swal.fire({ icon: 'success', title, text, confirmButtonColor: BRAND, timer: 1800 });

// ── Warning ─────────────────────────────────────────────────────────────────
export const warningAlert = (title: string, text?: string) =>
    Swal.fire({ icon: 'warning', title, text, confirmButtonColor: BRAND });

// ── Prompt ──────────────────────────────────────────────────────────────────
export const promptText = async (title: string, placeholder = '') => {
    const r = await Swal.fire({
        title,
        input: 'textarea',
        inputPlaceholder: placeholder,
        inputAttributes: { 'aria-label': placeholder },
        showCancelButton: true,
        confirmButtonColor: BRAND,
        cancelButtonColor: CANCEL,
        reverseButtons: true,
        inputValidator: (value) => (!value ? 'Please enter a description' : null),
    });
    return r.isConfirmed ? (r.value as string) : null;
};
