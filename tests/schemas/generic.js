module.exports = {
    properties: {
        text: {
            type: 'string'
        },
        integer: {
            type: 'integer'
        },
        float: {
            type: 'float'
        },
        boolean: {
            type: 'boolean'
        },
        date: {
            type: 'date'
        },
        datetime: {
            type: 'datetime'
        },
        array: {
            type: 'string',
            multi: true
        },
        relation: {
            type: 'GenericRelation'
        },
        relations: {
            type: 'GenericRelation',
            multi: true
        }
    }
};