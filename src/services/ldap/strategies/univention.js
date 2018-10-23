const request = require('request-promise-native');

const AbstractLDAPStrategy = require('./interface.js');

/**
 * Univention-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class UniventionLDAPStrategy extends AbstractLDAPStrategy {
	constructor(config) {
        super();
        this.config = config;
    }

    getSchoolsQuery() {
        const options = {
            filter: '(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school)))',
            scope: 'sub',
            attributes: []
        };
        const searchString = this.config.rootPath;
        return {searchString, options};
    }

    getUsersQuery(school) {
        const options = {
            filter: 'univentionObjectType=users/user',
            scope: 'sub',
            attributes: ['givenName', 'sn', 'mail', 'dn', 'entryUUID', 'uid', 'objectClass', 'memberOf']
        };
        const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
        return {searchString, options};
    }

    getClassesQuery(school) {
        const options = {
            filter: 'univentionObjectType=groups/group',
            scope: 'sub',
            attributes: []
        };
        const searchString = `cn=klassen,cn=schueler,cn=groups,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
        return {searchString, options};
    }

    addUserToGroup(user, group) {
		return this._updateUserGroups(user, [group], 'create');
    }

    removeUserFromGroup(user, group) {
		return this._updateUserGroups(user, [group], 'delete');
    }

    _generateGroupFile(userUUID, groups) {
        return new Buffer(JSON.stringify([
            {
                'entryUUID': userUUID,
                'nbc-global-groups': groups
            }
        ]));
    }

    _generateGroupUpdateFormData(user, groups, method='create') {
        return {
            input_file: {
                value: this._generateGroupFile(user.ldapId, groups),
                options: {
                    filename: 'test.json',
                    type: 'json',
                    contentType: 'application/json',
                },
            },
            school: `/v1/schools/${method}globalgroups/`,
            user_role: 'student',
            dryrun: 'false',
        };
    }

    _updateUserGroups(user, groups, method='create') {
        const username = process.env.NBC_IMPORTUSER;
        const password = process.env.NBC_IMPORTPASSWORD;
        const auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
        const REQUEST_TIMEOUT = 8000;

        const options = {
            uri: process.env.NBC_IMPORTURL,
            method: 'POST',
            formData: this._generateGroupUpdateFormData(user, groups, method),
            headers: {
                'content-type': 'multipart/form-data',
                'Authorization' : auth,
            },
            json: true,
            timeout: REQUEST_TIMEOUT
        };
        return request(options).then(message => {
            return message;
        });
    }
}

module.exports = UniventionLDAPStrategy;
