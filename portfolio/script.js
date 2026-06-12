document.addEventListener('DOMContentLoaded', () => {

    /* --- MOBILE NAV TOGGLE --- */
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinksMenu = document.getElementById('nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinksMenu.classList.toggle('open');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when nav link clicked
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinksMenu.classList.remove('open');
            mobileMenuToggle.classList.remove('active');
        });
    });


    /* --- ACTIVE LINKS ON SCROLL & SKILL BAR TRIGGER --- */
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-link');
    const skillBars = document.querySelectorAll('.progress-fill');
    
    // Store targets and reset progress fills
    const skillTargets = Array.from(skillBars).map(bar => bar.style.width);
    skillBars.forEach(bar => bar.style.width = '0%');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.25
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeId = entry.target.getAttribute('id');
                
                // Highlight active nav item
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${activeId}`) {
                        item.classList.add('active');
                    }
                });

                // Trigger skill bars animation
                if (activeId === 'skills') {
                    skillBars.forEach((bar, idx) => {
                        bar.style.width = skillTargets[idx];
                    });
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    /* --- CONTACT FORM VALIDATION --- */
    const contactForm = document.getElementById('contact-form');
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');
    const submitBtn = document.getElementById('contact-submit-btn');
    const successMsg = document.getElementById('form-success');
    const failureMsg = document.getElementById('form-failure');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(input, isValid) {
        const group = input.parentElement;
        if (isValid) {
            group.classList.remove('invalid');
            return true;
        } else {
            group.classList.add('invalid');
            return false;
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateField(nameInput, nameInput.value.trim() !== "");
            const isEmailValid = validateField(emailInput, emailRegex.test(emailInput.value.trim()));
            const isMsgValid = validateField(messageInput, messageInput.value.trim() !== "");

            if (isNameValid && isEmailValid && isMsgValid) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";

                setTimeout(() => {
                    successMsg.style.display = 'block';
                    failureMsg.style.display = 'none';
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Send Message";

                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 5000);
                }, 1500);
            } else {
                failureMsg.style.display = 'block';
                successMsg.style.display = 'none';

                setTimeout(() => {
                    failureMsg.style.display = 'none';
                }, 5000);
            }
        });

        // Real-time error removal
        nameInput.addEventListener('input', () => validateField(nameInput, nameInput.value.trim() !== ""));
        emailInput.addEventListener('input', () => validateField(emailInput, emailRegex.test(emailInput.value.trim())));
        messageInput.addEventListener('input', () => validateField(messageInput, messageInput.value.trim() !== ""));
    }


    /* --- SCROLL BACK TO TOP --- */
    const backToTopBtn = document.getElementById('back-to-top-btn');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
