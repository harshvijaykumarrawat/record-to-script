var express = require('express');
var router = express.Router();

router.post('/', function (req, res, next) {
    var body = req.body;
    res.send(JSON.stringify(analyze_relationship(body.record, body.object)));
});

const analyze_relationship = (record, fields) => {
    var analysis = {};
    analysis.key = record.Id.substring(0, 3);
    analysis.parents = {}
    analysis.soql = [];
    analysis.parent_count = 0
    analysis.has_parents = false;

    for (var i in fields) {
        if (fields[i].createable
            && record[fields[i].name] != null
            && record[fields[i].name] != 'OwnerId'
            && fields[i].soapType == 'tns:ID') {
            analysis.parents[record[fields[i].name]] = { Id: record[fields[i].name] };
            analysis.has_parents = true;
            analysis.parent_count++;
        }

        if (fields[i].soapType == 'xsd:string') {
            analysis.soql.push(fields[i].name + ' = \'' + record[fields[i].name] + '\'');
        } else if (fields[i].soapType == 'xsd:date') {
            analysis.soql.push(fields[i].name + ' = Date.valueof(\'' + record[fields[i].name] + '\')');
        } else if (fields[i].soapType == 'xsd:dateTime') {
            analysis.soql.push(fields[i].name + ' = DateTime.valueof(\'' + record[fields[i].name] + '\')');
        } else if (fields[i].soapType == 'tns:ID'
            && record[fields[i].name] != 'OwnerId') {
            analysis.soql.push({
                field: fields[i].name,
                assignment: ' = ',
                id: record[fields[i].name],
                lookup: (record[fields[i].name] != 'RecordTypeId')
            });
        } else {
            analysis.soql.push(fields[i].name + ' = ' + record[fields[i].name]);
        }
    }
    //analysis.variable = to_camele_case(object.label);
    return analysis;
}

const to_camele_case = (value) => {
    var split_value = value.split(' ');
    var var_string = '';
    for (var i in split_value) {
        if (i == 0) {
            var_string = split_value[i].toLowerCase();
        }
        var_string += split_value[i].toUpperCase().substring(0, 1);
        var_string += split_value[i].toLowerCase().substring(2, split_value[i].length - 1);
    }
    return var_string;
}



























module.exports = router;
