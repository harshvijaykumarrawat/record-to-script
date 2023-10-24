function showMsg(msg) {
    $.blockUI({ message: msg });
}

function toast(msg, type) {
    $.blockUI({ message: msg, css: { backgroundColor: type == 'error' ? '#ff0000' : '#483d8b', color: '#111111' }, timeout: 1000 });
}

function unblock() {
    $.unblockUI();
}