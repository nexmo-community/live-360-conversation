const getToken = () => localStorage.getItem('token');

const isLoggedIn = () => !!getToken();

const fetchNotifications = async (element) => {
    fetch(
        '/notifications',
        {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        },
    )
        .then((res) => res.text())
        .then(JSON.parse)
        .then((notices) => {
            buildNotifation(element, notices);
        });
};

const markAsRead = async (element, id) => {
    console.log(`Marking as read ${id}`);
    fetch(
        '/notifications',
        {
            method: 'POST',
            body: JSON.stringify({
                event_id: id,
            }),
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        },
    )
        .then(fetchNotifications(element));
};

const buildNotifation = (element, notices) => {
    element.replaceChildren();
    if (notices.length > 0) {
        const markAllElement = document.createElement('li');
        const markLink = document.createElement('a');
        markLink.innerHTML = 'mark all read';
        markLink.setAttribute('href', '#');

        markLink.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            markAsRead(element, '__all');
        });
        markAllElement.appendChild(markLink);
        element.appendChild(markAllElement);
    }
    notices.forEach((notice) => {
        const noticeElement = document.createElement('li');
        if (notice.icon) {
            const iconElement = document.createElement('i');
            iconElement.className = `bi ${notice.icon}`;
            noticeElement.appendChild(iconElement);
        }
        const messageElement = document.createElement('a');
        if (!notice.read) {
            messageElement.setAttribute('href', '#');
            messageElement.addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                markAsRead(element, notice.notification_id);
            });
        }
        messageElement.innerText = notice.message;
        if (notice.read) {
            messageElement.style.textDecoration = 'line-through';
        }

        noticeElement.appendChild(messageElement);
        element.appendChild(noticeElement);
    });
};

const pollNotifications = (element) => {
    setInterval(() => {
        fetchNotifications(element);
    }, 5000);
};

addEventListener('DOMContentLoaded', () => {
    console.log('Loaded');
    const loginForm = document.getElementById('loginForm');
    const nav = document.getElementById('navigation');
    const signOut = document.getElementById('signOut');
    const notificationList = document.getElementById('notificationList');


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
        pollNotifications(notificationList);
        fetchNotifications(notificationList);
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
