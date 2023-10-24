function authenticate(auth_type) {
    switch (auth_type) {
        case 'Password':
            showMsg('Authenticating to Salesforce');
            var credentials = {
                username: $('#username').val(),
                password: $('#password').val() + $('#security_token').val(),
                org: $('#is_production:checked').length > 0 ? 'https://login.salesforce.com' : 'https://test.salesforce.com'
            }
            api_login(credentials);
            break;
        case 'OAuth':
            showMsg('OAuth is available now');
            oauth_authentication();
            break;
    }
}

function api_login(credentials) {
    if (validate_creds(credentials)) {
        return;
    }
    $.ajax({
        type: "POST",
        url: '/authenticate',
        data: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' },
        success: function (data) {
            if (data != null) {
                if (data.hasOwnProperty('sf:exceptionMessage')) {
                    toast(data['sf:exceptionMessage'], 'error');
                    return;
                }
                $org.information = data;
                showMsg('Getting Metadata...');
                describe_org_metadata();
            }
        }
    });
}

function validate_creds(credentials) {
    for (var key in credentials) {
        if (credentials[key] == null
            || credentials[key] == undefined
            || credentials[key].trim() == '') {
            toast(key + ' is missing', 'error');
            return true;
        }
    }
}

function describe_org_metadata() {
    $('#login_content').hide();
    $('#record_view').show();
    $.ajax({
        type: "POST",
        url: '/describe?object=ALL',
        data: JSON.stringify($org.information),
        headers: { 'Content-Type': 'application/json' },
        success: function (response) {
            $org.metadata = JSON.parse(response);
            unblock();
        }
    });
}

function oauth_authentication() {
    $.ajax({
        type: "POST",
        url: '/authenticate/oauth',
        data: '{}',
        headers: { 'Content-Type': 'application/json' },
        success: function (response) {
            window.location.href = response.redirectURL;
            unblock();
        }
    });
}