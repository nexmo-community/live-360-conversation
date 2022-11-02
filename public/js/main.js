addEventListener('DOMContentLoaded', () => {
    console.log('Loaded');
    const loginForm = document.getElementById('loginForm');
    const notificationElement = document.getElementById('notificationList');
    const liveAlert = document.getElementById('liveAlertPlaceholder');
    const templateElement = document.getElementById('notificationToast');
    const markAllElement = document.getElementById('markAll');

    const setupAfterLogin = () => {
        loginForm.style.display = 'none';
        notificationElement.style.display = 'block';
        pollNotifications(
            markAllElement,
            templateElement,
            notificationElement,
        );
        fetchNotifications(
            markAllElement,
            templateElement,
            notificationElement,
        );
    };

    const setupLogin = () => {
        loginForm.style.display = 'block';
        loginForm.addEventListener('submit', (event) => {
            console.log('Login submit');
            event.stopPropagation();
            event.preventDefault();
            liveAlert.innerHTML = '';
            const formData = new FormData(loginForm);
            const data = {
                user: null,
                password: null,
            };
            for (const [key, value] of formData) {
                data[key] = value;
            }
            liveAlert.style.display = 'none';
            liveAlert.innerHTML = '';
            submitLogin(data)
                .then(() => {
                    liveAlert.style.display = 'none';
                })
                .then(setupAfterLogin)
                .catch(() => {
                    console.log('login failed');
                    liveAlert.style.display = 'block';
                    liveAlert.innerHTML = '';
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = [
                        `<div class="alert alert-danger alert-dismissible" role="alert">`,
                        `   <div>Login failed</div>`,
                        `   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`,
                        `</div>`,
                    ].join('');

                    liveAlert.append(wrapper);
                });
        });
    };

    if (!isLoggedIn()) {
        console.log('Not logged in');
        setupLogin();
        return;
    }

    setupAfterLogin();
});

const getToken = () => localStorage.getItem('token');

const isLoggedIn = () => !!getToken();

const submitLogin = (data) => fetch(
    '/login',
    {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    },
)
    .then((res) => {
        if (res.status == 200) {
            console.log('successful login');
            return res.text();
        }
        throw new Error('Login failed');
    })
    .then((text) => JSON.parse(text))
    .then(({ token }) => {
        if (token) {
            localStorage.setItem('token', token);
        }
    });

const fetchNotifications = async (
    markAllElement,
    templateElement,
    notificaitonElement,
) => {
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
            buildNotifation(
                markAllElement,
                templateElement,
                notificaitonElement,
                Array.isArray(notices) ? notices : [],
            );
        });
};


const buildNotifation = (
    markAllElement,
    templateElement,
    notificationElement,
    notices,
) => {
    notificationElement.replaceChildren();
    if (notices.length < 1) {
        markAllElement.style.display = 'none';
        notificationElement.innerHTML = 'No messages';
        return;
    }

    markAllElement.style.display = 'block';
    markAllElement.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        markAsRead(
            markAllElement,
            templateElement,
            notificationElement,
            '__all',
        );
    });

    notices.forEach((notice) => {
        const noticeElement = templateElement.content.cloneNode(true);
        noticeElement
            .querySelectorAll('.notice-title')[0]
            .innerHTML = notice.title
                ? notice.title
                : '';

        const noticeDate = moment(notice.timestamp, moment.ISO_8601);
        noticeElement
            .querySelectorAll('.notification-date')[0]
            .innerHTML = noticeDate.fromNow();

        noticeElement
            .querySelectorAll('.notification-message')[0]
            .innerHTML = notice.message;

        noticeElement
            .querySelectorAll('.mark-as-read')[0]
            .addEventListener('click', (event) => {
                event.stopPropagation();
                event.preventDefault();
                markAsRead(
                    markAllElement,
                    templateElement,
                    notificationElement,
                    notice.notification_id,
                );
            });

        noticeElement
            .querySelectorAll('.bi-check-lg')[0]
            .style.display = notice.read ? 'block' : 'none';

        notificationElement.appendChild(noticeElement);
    });

    notificationElement
        .querySelectorAll('.toast')
        .forEach((element) => element.style.display = 'block');
};

const markAsRead = async (
    markAllElement,
    templateElement,
    notificationElement,
    id,
) => {
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
        .then(fetchNotifications(
            markAllElement,
            templateElement,
            notificationElement,
        ));
};

const pollNotifications = (
    markAllElement,
    templateElement,
    notificationElement,
) => {
    setInterval(() => {
        fetchNotifications(
            markAllElement,
            templateElement,
            notificationElement,
        );
    }, 5000);
};
