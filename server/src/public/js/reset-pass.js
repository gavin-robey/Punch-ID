const form = document.getElementById('form');
const messageTag = document.getElementById('message');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');
const notification = document.getElementById('notification');
const submitButton = document.getElementById('submit');
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

form.style.display = "none";

const displayNotification = (message,type) => {
    notification.style.display = 'block';
    notification.innerText = message;
    notification.classList.add(type);
}

let token;
let id;


window.addEventListener('DOMContentLoaded', async () => {
    const param = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => {
            return searchParams.get(prop);
        },
    });

    token = param.token
    id = param.id

    const res = await fetch('/auth/verify-pass-reset-token', {
        method: 'POST',
        body: JSON.stringify({ id, token }),
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    });

    if(!res.ok){
        const {message} = await res.json();
        messageTag.innerText = message;
        messageTag.classList.add('error');
        return;
    };

    messageTag.style.display = "none";
    form.style.display = "block";
});

const handleSubmit = async(event) => {
    event.preventDefault();

    if(!passwordRegex.test(password.value)){
        return displayNotification("Invalid password, Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character", "error")
    }

    if(password.value !== confirmPassword.value){
        return displayNotification("Passwords do not match!", "error")
    }

    // submit form
    submitButton.disabled = true;
    submitButton.innerText = "Please wait...";

    const res = await fetch("/auth/reset-pass", {
        method: 'POST',
        body: JSON.stringify({ id, token, password: password.value }),
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    });

    submitButton.disabled = false;
    submitButton.innerText = "Update Password";

    if(!res.ok){
        const { message } = await res.json();
        return displayNotification(message, "error");
    }

    messageTag.style.display = "block";
    messageTag.innerText = "Your password updated successfully!";
    form.style.display = 'none';
}

form.addEventListener('submit', handleSubmit);