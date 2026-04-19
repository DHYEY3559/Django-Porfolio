/**
 * Contact form — EmailJS integration with validation and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS (replace with your actual keys)
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: 'YOUR_PUBLIC_KEY',  // Replace with your EmailJS public key
        });
    }

    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('contact-submit');
    const submitText = document.getElementById('submit-text');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate
        const name = form.querySelector('[name="from_name"]').value.trim();
        const email = form.querySelector('[name="user_email"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();

        if (!name || !email || !message) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        // Send
        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.textContent = 'Sending...';

        try {
            if (typeof emailjs !== 'undefined') {
                await emailjs.sendForm(
                    'YOUR_SERVICE_ID',    // Replace with your EmailJS service ID
                    'YOUR_TEMPLATE_ID',   // Replace with your EmailJS template ID
                    form
                );
            }
            showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
            form.reset();
        } catch (error) {
            console.error('EmailJS Error:', error);
            showToast('Failed to send message. Please try again or email directly.', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.textContent = 'Send Message';
        }
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showToast(message, type = 'success') {
        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;

        // Update icon color
        const icon = toast.querySelector('i');
        if (icon) {
            icon.className = '';
            if (type === 'success') {
                icon.setAttribute('data-lucide', 'check-circle');
                icon.style.color = '#10b981';
            } else {
                icon.setAttribute('data-lucide', 'alert-circle');
                icon.style.color = '#f43f5e';
            }
            if (window.lucide) lucide.createIcons();
        }

        // Show
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
        toast.style.pointerEvents = 'auto';

        // Auto-hide
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            toast.style.pointerEvents = 'none';
        }, 4000);
    }
});
