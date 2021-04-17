if (window.innerWidth <= 1000) {
    let alertELement = document.createElement('div');
    alertELement.setAttribute('class', 'my-40 mx-auto font-bold text-3xl text-center');
    alertELement.innerHTML = 'Ứng dụng hiện tại chỉ hỗ trợ desktop/laptop';

    let bodyElement = document.querySelector('body');
    bodyElement.innerHTML = '';
    bodyElement.appendChild(alertELement);
}