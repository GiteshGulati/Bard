
        if (BardAuth.isLoggedIn()) {
            window.location.href = 'profile.html';
        }
        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            var firstName = document.getElementById('firstName').value;
            var lastName = document.getElementById('lastName').value;
            var email = document.getElementById('email').value;
            var password = document.getElementById('password').value;
            if (password.length < 6) {
                var existing = document.getElementById('auth-error');
                if (existing) existing.remove();
                var err = document.createElement('p');
                err.id = 'auth-error';
                err.className = 'text-sm text-center mt-2';
                err.style.color = '#F87171';
                err.textContent = 'Password must be at least 6 characters.';
                document.querySelector('form').appendChild(err);
                return;
            }
            var result = BardAuth.signup(firstName, lastName, email, password);
            if (result.ok) {
                window.location.href = 'profile.html';
            } else {
                var existing2 = document.getElementById('auth-error');
                if (existing2) existing2.remove();
                var err2 = document.createElement('p');
                err2.id = 'auth-error';
                err2.className = 'text-sm text-center mt-2';
                err2.style.color = '#F87171';
                err2.textContent = result.error;
                document.querySelector('form').appendChild(err2);
            }
        });