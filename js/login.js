
        if (BardAuth.isLoggedIn()) {
            window.location.href = 'profile.html';
        }
        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            var email = document.getElementById('email').value;
            var password = document.getElementById('password').value;
            var result = BardAuth.login(email, password);
            if (result.ok) {
                window.location.href = 'profile.html';
            } else {
                var existing = document.getElementById('auth-error');
                if (existing) existing.remove();
                var err = document.createElement('p');
                err.id = 'auth-error';
                err.className = 'text-sm text-center mt-2';
                err.style.color = '#F87171';
                err.textContent = result.error;
                document.querySelector('form').appendChild(err);
            }
        });