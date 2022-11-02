const fetchNotifications = async () => {
    fetch(
        '/notifications',
    )
        .then((res) => res.text())
        .then(JSON.parse)
        .then((notices) => {
            console.log(notices);
        });
};

const pollNotifications = () => {
    setInterval(() => {
        fetchNotifications();
    }, 1000);
};

addEventListener('DOMContentLoaded', () => {
    console.log('Loaded');
    const loginForm = document.getElementById('loginForm');
    const nav = document.getElementById('navigation');
    const signOut = document.getElementById('signOut');

    const getToken = () => localStorage.getItem('token');

    const isLoggedIn = () => !!getToken();

    signOut.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        localStorage.removeItem('token');
        setupLogin();
    });

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
        signOut.style.display = 'block';
        pollNotifications();
    };

    const setupLogin = () => {
        loginForm.style.display = 'block';
        nav.style.display = 'none';
        signOut.style.display = 'none';
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
