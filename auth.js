(function () {
    const USERS_KEY = 'bard-users';
    const SESSION_KEY = 'bard-session';

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function setSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.firstName + ' ' + user.lastName, firstName: user.firstName, lastName: user.lastName }));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    window.BardAuth = {
        signup: function (firstName, lastName, email, password) {
            var users = getUsers();
            email = email.toLowerCase().trim();
            if (users.some(function (u) { return u.email === email; })) {
                return { ok: false, error: 'An account with this email already exists.' };
            }
            var user = { firstName: firstName.trim(), lastName: lastName.trim(), email: email, password: password };
            users.push(user);
            saveUsers(users);
            setSession(user);
            return { ok: true };
        },

        login: function (email, password) {
            var users = getUsers();
            email = email.toLowerCase().trim();
            var user = users.find(function (u) { return u.email === email && u.password === password; });
            if (!user) {
                return { ok: false, error: 'Invalid email or password.' };
            }
            setSession(user);
            return { ok: true };
        },

        logout: function () {
            clearSession();
            window.location.href = 'index.html';
        },

        getUser: function () {
            try {
                return JSON.parse(localStorage.getItem(SESSION_KEY));
            } catch {
                return null;
            }
        },

        isLoggedIn: function () {
            return !!this.getUser();
        },

        updateNav: function () {
            var user = this.getUser();
            document.querySelectorAll('[data-auth-logged-in]').forEach(function (el) {
                el.style.display = user ? '' : 'none';
            });
            document.querySelectorAll('[data-auth-logged-out]').forEach(function (el) {
                el.style.display = user ? 'none' : '';
            });
            document.querySelectorAll('[data-auth-name]').forEach(function (el) {
                el.textContent = user ? user.firstName : '';
            });
        }
    };
})();
