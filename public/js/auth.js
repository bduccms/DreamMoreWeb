document.addEventListener('DOMContentLoaded', () => {
  const signUpForm = document.getElementById('signUpForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const rocketOverlay = document.getElementById('rocketOverlay'); // New fullscreen rocket

  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Client-side validation
    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      errorMessage.textContent = 'All fields are required';
      errorMessage.style.display = 'block';
      return;
    }
    if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
      errorMessage.textContent = 'Names should contain only letters';
      errorMessage.style.display = 'block';
      return;
    }
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      errorMessage.textContent = 'Phone number should be 10 digits';
      errorMessage.style.display = 'block';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage.textContent = 'Invalid email format';
      errorMessage.style.display = 'block';
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      errorMessage.textContent = 'Password must be at least 8 characters with letters and numbers';
      errorMessage.style.display = 'block';
      return;
    }

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phoneNumber, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Hide error if visible
        errorMessage.style.display = 'none';

        // Show success message
        successMessage.textContent = data.message || 'Welcome! You are registered at Dream More 🎉';
        successMessage.style.display = 'block';
        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 3000);

        // 🚀 Trigger fullscreen rocket animation
        rocketOverlay.style.display = 'flex';
        setTimeout(() => {
          rocketOverlay.style.display = 'none';
        }, 4000); // Animation duration

        // Clear form
        signUpForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('signInModal')).hide();
      } else {
        errorMessage.textContent = data.message || 'Registration failed. Please try again.';
        errorMessage.style.display = 'block';
      }
    } catch (err) {
      console.error('Registration request failed:', err);
      errorMessage.textContent = 'An error occurred. Please try again.';
      errorMessage.style.display = 'block';
    }
  });
});
