import Swal from 'sweetalert2';

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

export const confirm = async (title: string, text?: string, confirmText = 'Yes') => {
    const r = await Swal.fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: '#2d6a4f',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
    });
    return r.isConfirmed;
};

export const loading = (title = 'Please wait…') =>
    Swal.fire({
        title,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
    });

export const closeLoading = () => Swal.close();

export const errorAlert = (title: string, text?: string) =>
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#2d6a4f' });

export const successAlert = (title: string, text?: string) =>
    Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#2d6a4f', timer: 1800 });

export const promptText = async (title: string, placeholder = '') => {
    const r = await Swal.fire({
        title,
        input: 'textarea',
        inputPlaceholder: placeholder,
        inputAttributes: { 'aria-label': placeholder },
        showCancelButton: true,
        confirmButtonColor: '#2d6a4f',
        inputValidator: (value) => (!value ? 'Please enter a description' : null),
    });
    return r.isConfirmed ? (r.value as string) : null;
};
