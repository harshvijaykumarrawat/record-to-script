function getRecord() {
    var recordIds = $('#record_id').val().split(',');
	for(let recordId of recordIds){
		showMsg('Accessing Record..' + recordId);
		describe_record(recordId);	
	}
}

function describe_record(recordId, callback_method) {
    if ($org.records.hasOwnProperty(recordId)
        && $org.records[recordId].record != null) {
        if (callback_method != null) {
            callback_method($org.records[recordId].record,
                $org.object_metadata[$org.records[recordId].object_name]);
        }
        unblock();
        return true;
    }
    var object_name = $org.metadata[recordId.substring(0, 3)].name;
    var is_object_exists = $org.object_metadata.hasOwnProperty(object_name);
    var object = is_object_exists ? $org.object_metadata[object_name] : {};
    $.ajax({
        type: "POST",
        url: '/describe/record?object=' + object_name + '&recordid=' + recordId,
        data: JSON.stringify($org.information),
        headers: { 'Content-Type': 'application/json' },
        success: function (response) {
            var records = JSON.parse(response);


            for (var i in records) {
                if (!$org.records.hasOwnProperty(records[i].Id)) {
                    $org.records[records[i].Id] = {};
                }
                $org.records[records[i].Id].record = records[i];
                $org.records[records[i].Id].object_name = object_name;
                $org.records[records[i].Id].is_record_type = object_name == 'RecordType';
                $org.records[records[i].Id].object = object;

                if (is_object_exists)
                    analyze_relationship($org.records[records[i].Id]);
            }

            if (!is_object_exists) {
                showMsg('Accessing Object ' + object_name + ' ...');
                describe_object(object_name, records, callback_method);
            } else {
                analyze_relationship(records)
                if (callback_method != null) {
                    callback_method(records, $org.object_metadata[object_name]);
                }
                unblock();
            }
        }
    });
    return false;
}

function describe_object(object_name, records, describe_object_callback) {
    if ($org.object_metadata.hasOwnProperty(object_name)) {
        if (describe_object_callback != null) {
            describe_object_callback(records, $org.object_metadata[object_name]);
        } else {
            unblock();
        }
        return;
    }
    $.ajax({
        type: "POST",
        url: '/describe?object=' + object_name,
        data: JSON.stringify($org.information),
        headers: { 'Content-Type': 'application/json' },
        success: function (response) {
            console.log(response);
            $org.object_metadata[object_name] = JSON.parse(response);
            for (var i in records) {
                $org.records[records[i].Id].object = $org.object_metadata[object_name];
                analyze_relationship($org.records[records[i].Id]);
            }
            if (describe_object_callback != null) {
                describe_object_callback(records, $org.object_metadata[object_name]);
            } else {
                unblock();
            }

        }
    });
}

function get_parents_from_id(recordid) {
    get_parents([$org.records[recordid].record], $org.object_metadata[$org.records[recordid].object_name]);
}

function get_parents(record, object) {
    if ($('#' + record.Id).html() == null) {
        design_record_ui([record], object);
    }
    for (var i in object.fields) {
        if (object.fields[i].createable
            && object.fields[i].soapType == 'tns:ID'
            && object.fields[i].name != 'OwnerId'
            && record[object.fields[i].name] != null
            && !$org.records.hasOwnProperty(record[object.fields[i].name])) {
            describe_record(record[object.fields[i].name], get_parents, get_parents);
        }
    }
}

function design_record_ui(record, object_name) {
    var dataString = '';
    for (var key in record) {
        if (typeof record[key] != 'object' && record[key] != 'Name') {
            dataString += key + ' = ' + record[key] + ' | ';
        }
        if (dataString.length > 255) {
            break;
        }
    }
    var record_html = '<div class="card mt-4" id="' + record.Id + '">' +
        '<div class="card-body">' +
        '<h5 class="card-title">' + object_name + '[' + record.Id + '(Name = ' + record.Name + ' )]' + '</h5>' +
        '<p class="card-text">' + dataString + '...</p>' +
        '<a href="#" onclick="view_record(\'' + record.Id + '\')" class="btn btn-primary">View Record</a>' +
        '</div>' +
        '</div>';
    $('#record_view').html($('#record_view').html() + record_html);
    //get_parents(records, object);
}

function view_record(recordId){
    var recordHtml = '<table class="record"> <tr> <th>Field</th> <th>Value</th> </tr>';
    for(var field in $org.records[recordId].record){
        if(typeof $org.records[recordId].record[field] != 'object')
        recordHtml += '<tr> <td>'+field+'</td><td>'+$org.records[recordId].record[field]+'</td></tr>';
    }
    recordHtml += '</table>';
    $('#modalBody').html(recordHtml);
    $('#modalUI').modal('show');
}

function clear_records(){
    $org.records= {};
    $org.objects= {};
    $org.object_metadata= {};
    $org.analysis= {};
	$('#record_view').html('<div class="row" id="record-id-row" style="margin-top:80px"><div class="col-lg-2 text-center"></div><div class="col-lg-8" style="display:inherit"><input style="display:inline;width:60%" type="text" class="form-control" id="record_id" placeholder="Record Id"> &nbsp;&nbsp;&nbsp;&nbsp;<button style="display:inline" type="button" onclick="getRecord()" class="btn btn-primary">Get Record</button>&nbsp;<button style="display:inline" type="button" onclick="generate_script()" class="btn btn-primary">Script</button>&nbsp;<button style="display:inline" type="button" onclick="clear_records()" class="btn btn-primary">Clear</button></div><div class="col-lg-2 text-center"></div></div>');
}