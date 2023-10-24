function analyze_relationship(record) {
    var object = record.object;
    var data_record = record.record;
    design_record_ui(data_record, record.object_name);
    record.key = data_record.Id.substring(0, 3);
    record.parents = {}
    record.soql = [];
    record.parent_count = 0
    record.has_parents = false;
    record.variable_index = -1;

    for (var i in object.fields) {
        if (object.fields[i].createable
            && data_record[object.fields[i].name] != null
            && data_record[object.fields[i].name] != 'OwnerId'
            && object.fields[i].soapType == 'tns:ID') {
            if (!$org.records.hasOwnProperty(data_record[object.fields[i].name])) {
                $org.records[data_record[object.fields[i].name]] = { childs: {}, child_count: 0, has_childs: false };
            }
            $org.records[data_record[object.fields[i].name]].childs[data_record.Id] = record;
            record.parents[data_record[object.fields[i].name]] = $org.records[data_record[object.fields[i].name]];
            $org.records[data_record[object.fields[i].name]].has_childs = true;
            record.has_parents = true;
            $org.records[data_record[object.fields[i].name]].child_count++;
            record.parent_count++;
            describe_record(data_record[object.fields[i].name]);
        }
    }
    record.variable = to_camele_case(object.label);
}

const analyze_variables = () => {
    for (var i in $org.records) {
        analyze_variable($org.records[i], {});
    }
}

const analyze_variable = (record) => {
    if (record.variable_index == -1
        && !record.has_parents) {
        record.variable_index = 0;
    } else if (record.variable_index == -1) {
        var variable_index = -1;
        for (var parent_id in record.parents) {
            variable_index = analyze_variable(record.parents[parent_id]);
            if (record.variable_index < variable_index) {
                record.variable_index = variable_index;
            }
        }
    }
    return (record.variable_index + 1)
}
/*
const analyze_variable = (record, traced) => {
    traced = traced == null ? {} : traced;
    if (record.has_parents
        && !traced.hasOwnProperty(record.record.Id)
        && !traced[record.record.Id]) {
        for (var parent_id in record.parents) {
            if (record.variable_index < $org.records[parent_id].variable_index) {
                record.variable_index = $org.records[parent_id].variable_index + 1;
            }
        }
    }

    if (record.has_childs
        && !traced.hasOwnProperty(record.record.Id)
        && !traced[record.record.Id]) {
        for (var child_id in record.childs) {
            if (record.variable_index >= $org.records[child_id].variable_index) {
                $org.records[child_id].variable_index = record.variable_index - 1;
            }
        }
    }
}*/

const generate_script = () => {
    var script_string = '';
    if ($org.script == undefined || $org.script.trim() != '') {
        analyze_variables();
        var i = -1;
        var variable_record_index = {};
        var is_any_script = false;
        var variables_in_order = [];
        var record_types = [];
        var record_data, record;
        while (true) {
            i++;
            is_any_script = false;
            for (var j in $org.records) {
                record_data = $org.records[j].record;
                record = $org.records[j];
                if (record.is_record_type) {
                    record_type_scrip(record, record_data);
                    record_types.push(record_data);
                    record.variable_index = -1;
                }
                if (record.variable_index == i) {
                    var variable_name = record.variable + record.variable_index;
                    if (!variable_record_index.hasOwnProperty(variable_name)) {
                        variable_record_index[variable_name] = {};
                        variable_record_index[variable_name].index = -1;
                        variable_record_index[variable_name].records = [];
                        variables_in_order.push({ variable_name: variable_name, object_name: record.object_name });
                    }
                    variable_record_index[variable_name].index++;
                    variable_record_index[record_id] = variable_name + '[' + variable_record_index[variable_name].index + ']';
                    is_any_script = true;
                    variable_record_index[variable_name].records.push(record);
                    record.array_index = variable_record_index[variable_name].records.length - 1;
                    record.variable_name = variable_name;
                    record.child_variable = variable_name + '[' + record.array_index + '].Id';
                }
            }
            if (!is_any_script) {
                break;
            }
        }
        var script = [];
        for (var j in $org.records) {
            script = create_script($org.records[j].object, $org.records[j].record);
            $org.records[j].script = $org.records[j].variable_name + '.add(new ' + $org.records[j].object_name + '(' + script.join(', ') + '));';
        }

debugger;
        for (var i in variables_in_order) {
            script_string += 'List<' + variables_in_order[i].object_name + '> ' + variables_in_order[i].variable_name + ' = new List<' + variables_in_order[i].object_name + '>();\n';
            for (var j in variable_record_index[variables_in_order[i].variable_name].records) {
                script_string += variable_record_index[variables_in_order[i].variable_name].records[j].script + '\n'
            }
            script_string += 'insert ' + variables_in_order[i].variable_name + ';\n\n';
        }
        $org.script = script_string;
    } else {
        script_string = $org.script;
    }
    $('#modalBody').html('<textarea rows="20" cols="100">'+$org.script+'</textarea>');
    $('#modalUI').modal('show');
    return $org.script;
}

const record_type_scrip = (record, data_record) => {
    record.script = " Schema.SObjectType." + data_record.SobjectType + ".getRecordTypeInfosByName().get('" + data_record.Name + "').getRecordTypeId()";
}

const create_script = (object, data_record, variable_record_index) => {
    var script = [];
    for (var i in object.fields) {
        if (object.fields[i].createable && data_record[object.fields[i].name] != null) {
            if (object.fields[i].soapType == 'xsd:string') {
                script.push(object.fields[i].name + ' = \'' + data_record[object.fields[i].name].split('\n').join('\\n') + '\'');
            } else if (object.fields[i].soapType == 'xsd:date') {
                script.push(object.fields[i].name + ' = Date.valueof(\'' + data_record[object.fields[i].name] + '\')');
            } else if (object.fields[i].soapType == 'xsd:dateTime') {
                script.push(object.fields[i].name + ' = DateTime.valueof(\'' + data_record[object.fields[i].name].split('T').join(' ').split('.')[0] + '\')');
            } else if (object.fields[i].soapType == 'xsd:boolean') {
                script.push(object.fields[i].name + ' = ' + (data_record[object.fields[i].name] ? 'TRUE' : 'FALSE'));
            } else if (object.fields[i].name == 'RecordTypeId') {
                script.push(object.fields[i].name + " = " + $org.records[data_record[object.fields[i].name]].script);
            } else {
                if (object.fields[i].soapType == 'tns:ID'
                    && object.fields[i].name != 'OwnerId') {
                    script.push(object.fields[i].name + ' = ' + $org.records[data_record[object.fields[i].name]].child_variable);
                }
            }
        }
    }
    return script;
}

function to_camele_case(value) {
    var split_value = value.split(' ');
    var var_string = '';
    for (var i in split_value) {
        if (i == 0) {
            var_string = split_value[i].toLowerCase();
        } else {
            var_string += split_value[i].toUpperCase().substring(0, 1);
            var_string += split_value[i].toLowerCase().substring(2, split_value[i].length - 1);
        }

    }
    return var_string + 'List';
}

function get_parents(record, object) {
    var parents = []
    for (var i in object.fields) {
        if (object.fields[i].createable
            && object.fields[i].soapType == 'tns:ID'
            && object.fields[i].name != 'OwnerId'
            && record[object.fields[i].name] != null) {
            parents.push(record[object.fields[i].name]);
        }
    }
}











/*


const create_heirarichy = (records, objects) => {
    var relationships = { objects: {}, variables: {} };
    for (var i in records) {
        var record = records[i];
        records[record.Id] = record;
        check_relationship(relationships, record.Id);
        relationships[record.Id].record = record;
        relationships[record.Id].key = record.Id.substring(0, 3);
        analyze_parents(properties, object_map[relationships[record.Id].key].name, record, relationships);
    }
    analyze_childs(relationships);
    analyze_variables(relationships);
    generate_script(relationships)
}

const generate_script = (relationships) => {
    var i = -1;
    var variable_record_index = {};
    var is_any_script = false;
    var variables_in_order = [];
    while (true) {
        i++;
        is_any_script = false;
        for (var record_id in relationships) {
            if (relationships[record_id].variable_index == i) {
                var variable_name = relationships[record_id].variable + relationships[record_id].variable_index;
                if (!variable_record_index.hasOwnProperty(variable_name)) {
                    variable_record_index[variable_name] = {};
                    variable_record_index[variable_name].index = -1;
                    variable_record_index[variable_name].records = [];
                    variables_in_order.push({ variable_name: variable_name, object_name: relationships[record_id].object_name });
                }
                variable_record_index[variable_name].index++;
                variable_record_index[record_id] = variable_name + '[' + variable_record_index[variable_name].index + ']';
                var script = create_script(relationships[record_id].object, relationships[record_id].record, variable_record_index);
                relationships[record_id].script = variable_name + '.add(new ' + relationships[record_id].object_name + '(' + script.join(', ') + '));';
                is_any_script = true;
                variable_record_index[variable_name].records.push(relationships[record_id]);
            }
        }
        if (!is_any_script) {
            break;
        }
    }
    var script_string = '';
    for (var i in variables_in_order) {
        script_string += 'List<' + variables_in_order[i].object_name + '> ' + variables_in_order[i].variable_name + ' = new List<' + variables_in_order[i].object_name + '>();\n';
        for (var j in variable_record_index[variables_in_order[i].variable_name].records) {
            script_string += variable_record_index[variables_in_order[i].variable_name].records[j].script + '\n'
        }
        script_string += 'insert ' + variables_in_order[i].variable_name + ';\n\n';
    }
    console.log(script_string);
    return script_string;
}

const create_script = (object, record, variable_record_index) => {
    var script = [];
    for (var i in object.fields) {
        if (object.fields[i].createable && record[object.fields[i].name] != null) {
            if (object.fields[i].soapType == 'xsd:string') {
                script.push(object.fields[i].name + ' = \'' + record[object.fields[i].name] + '\'');
            } else if (object.fields[i].soapType == 'xsd:date') {
                script.push(object.fields[i].name + ' = Date.valueof(\'' + record[object.fields[i].name] + '\')');
            } else if (object.fields[i].soapType == 'xsd:dateTime') {
                script.push(object.fields[i].name + ' = DateTime.valueof(\'' + record[object.fields[i].name] + '\')');
            } else {
                if (object.fields[i].soapType == 'tns:ID'
                    && object.fields[i].name == 'RecordTypeId') {
                    script.push(object.fields[i].name + ' = ' + variable_record_index[record[object.fields[i].name]]);
                } else if (object.fields[i].soapType == 'tns:ID') {
                    script.push(object.fields[i].name + ' = ' + variable_record_index[record[object.fields[i].name]]);
                } else if (object.fields[i].soapType == 'xsd:boolean') {
                    script.push(object.fields[i].name + ' = ' + variable_record_index[record[object.fields[i].name]]);
                }
            }
        }
    }
    return script;
}

const check_relationship = (relationships, record_id) => {
    if (!relationships.hasOwnProperty(record_id)) {
        relationships[record_id] = {
            parents: {},
            has_parents: false,
            parent_count: 0,
            record: {},
            childs: {},
            has_childs: false,
            child_count: 0,
            key: '',
            variable: '',
            variable_index: -1
        };
    }
}



const analyze_childs = (relationships) => {
    for (var record_id in relationships) {
        for (var parent_id in relationships[record_id].parents) {
            relationships[parent_id].childs[record_id] = relationships[record_id];
            relationships[parent_id].has_childs = true;
            relationships[parent_id].child_count++;
        }
    }
}

const analyze_parents = (properties, object_name, record, relationships) => {
    if (!relationships.objects.hasOwnProperty([object_name])) {
        relationships.objects[object_name] = JSON.parse(fs.readFileSync('./records-handler/' + properties.organizationId + '/objects/' + object_name + '.json').toString());
    }
    var object = relationships.objects[object_name];
    for (var i in object.fields) {
        if (object.fields[i].createable
            && record[object.fields[i].name] != null
            && record[object.fields[i].name] != 'OwnerId'
            && record[object.fields[i].name] != 'RecordTypeId'
            && object.fields[i].soapType == 'tns:ID') {
            check_relationship(relationships, record[object.fields[i].name]);
            relationships[record.Id].parents[record[object.fields[i].name]] = relationships[record[object.fields[i].name]];
            relationships[record.Id].has_parents = true;
            relationships[record.Id].parent_count++;
        }

    }

    relationships[record.Id].object_name = object_name;
    relationships[record.Id].object = relationships.objects[object_name];
    relationships[record.Id].variable = to_camele_case(object.label);
    relationships.variables[relationships[record.Id].variable] = {};
}

const analyze_variables = (relationships) => {
    for (var record_id in relationships) {
        analyze_variable(relationships, record_id);
    }
}

const analyze_variable = (relationships, record_id) => {
    if (relationships[record_id].variable_index == -1
        && !relationships[record_id].has_parents) {
        relationships[record_id].variable_index = 0;
    } else if (relationships[record_id].variable_index == -1) {
        var variable_index = -1;
        for (var parent_id in relationships[record_id].parents) {
            variable_index = analyze_variable(relationships, parent_id);
            if (relationships[record_id].variable_index < variable_index) {
                relationships[record_id].variable_index = variable_index;
            }
        }
    }
    return (relationships[record_id].variable_index + 1)
}

const to_camele_case = (value) => {
    var split_value = value.split(' ').join('');
    var camele_case = '';
    for (var i in split_value) {
        if (i > 0)
            camele_case += split_value[i].substring(0, 0).toUpperCase() + split_value[i].substring(1, split_value[i].length - 1).toLowerCase();
        else
            camele_case += split_value[i].toLowerCase();
    }
    return camele_case;
}


















*/




