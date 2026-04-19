/**
 * Project cards — 3D tilt effect on hover using CSS transforms.
 */

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('[data-tilt]');
    const maxRotation = 8; // degrees

    cards.forEach(card => {
        const inner = card.querySelector('.glass-card');
        if (!inner) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -maxRotation;
            const rotateY = ((x - centerX) / centerX) * maxRotation;

            inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            inner.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });

        card.addEventListener('mouseenter', () => {
            inner.style.transition = 'transform 0.1s ease';
        });
    });
});
