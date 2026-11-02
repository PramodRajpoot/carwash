import Swal from 'sweetalert2';

/**
 * Copies text to the clipboard reliably in both secure (HTTPS/localhost)
 * and insecure (HTTP) contexts, and displays a user feedback toast.
 *
 * @param {string} text - The text to copy
 * @param {string} message - Optional toast notification message
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text, message = 'Copied to clipboard!') {
  if (!text) return false;

  let success = false;

  // 1. Try modern Clipboard API if supported and in secure context
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, using fallback:', err);
    }
  }

  // 2. Fallback for insecure context (e.g. http://carwash.local) or legacy browsers
  if (!success) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('execCommand copy fallback failed:', err);
    }
  }

  if (success) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  } else {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Failed to copy to clipboard',
      showConfirmButton: false,
      timer: 2000,
    });
  }

  return success;
}
