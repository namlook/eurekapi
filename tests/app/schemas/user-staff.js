
module.exports = {
    meta: {
        names: {
            plural: 'user-stuff'
        }
    },
    properties: {
        _owner: {
            type: 'User'
        },
        _scope: {
            type: 'array',
            items: 'string'
        },
        title: {
            type: 'string'
        },
        isSecret: {
            type: 'boolean'
        }
    }
};