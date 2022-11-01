addEventListener('DOMContentLoaded', () => {
    console.log('Loaded');
    const loginForm = document.getElementById('loginForm');
    const nav = document.getElementById('navigation');

    const getToken = () => localStorage.getItem('token');

    const isLoggedIn = () => !!getToken();

    const submitLogin = (data) => {
        console.log('Submitting login');
        fetch(
            '/login',
            {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
            .then((res) => res.text())
            .then((text) => JSON.parse(text))
            .then(({ token }) => localStorage.setItem('token', token))
            .then(setupAfterLogin);
    };

    const setupAfterLogin = () => {
        nav.style.display = 'block';
        loginForm.style.display = 'none';
    };

    const setupLogin = () => {
        loginForm.style.display = 'block';
        nav.style.display = 'none';
        loginForm.addEventListener('submit', (event) => {
            console.log('Login submit');
            event.stopPropagation();
            event.preventDefault();
            const formData = new FormData(loginForm);
            const data = {
                user: null,
                password: null,
            };
            for (const [key, value] of formData) {
                data[key] = value;
            }
            submitLogin(data);
        });
    };

    if (!isLoggedIn()) {
        console.log('Not logged in');
        setupLogin();
        return;
    }

    setupAfterLogin();
});
