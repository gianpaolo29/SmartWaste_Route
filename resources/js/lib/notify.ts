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

// ── Loading with truck animation ────────────────────────────────────────────
const truckHtml = `
<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0">
  <div style="position:relative;width:120px;height:48px">
    <svg viewBox="0 0 120 48" width="120" height="48" style="position:relative;z-index:1">
      <!-- truck body -->
      <rect x="28" y="8" width="52" height="28" rx="4" fill="#059669"/>
      <!-- cabin -->
      <rect x="80" y="16" width="24" height="20" rx="3" fill="#10b981"/>
      <!-- windshield -->
      <rect x="84" y="19" width="16" height="10" rx="2" fill="#d1fae5"/>
      <!-- cargo lines -->
      <rect x="34" y="14" width="18" height="3" rx="1.5" fill="#34d399" opacity="0.6"/>
      <rect x="34" y="20" width="12" height="3" rx="1.5" fill="#34d399" opacity="0.4"/>
      <!-- wheels -->
      <circle cx="44" cy="38" r="6" fill="#374151"/>
      <circle cx="44" cy="38" r="2.5" fill="#9ca3af"/>
      <circle cx="90" cy="38" r="6" fill="#374151"/>
      <circle cx="90" cy="38" r="2.5" fill="#9ca3af"/>
    </svg>
  </div>
  <div style="width:180px;height:4px;border-radius:2px;background:#e5e7eb;overflow:hidden">
    <div style="width:40%;height:100%;border-radius:2px;background:linear-gradient(90deg,#059669,#10b981);animation:swal-truck-bar 1.2s ease-in-out infinite"></div>
  </div>
</div>
<style>
@keyframes swal-truck-bar{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
</style>`;

export const loading = (title = 'Please wait…') =>
    Swal.fire({
        title,
        html: truckHtml,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
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
