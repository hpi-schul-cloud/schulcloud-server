const request = require('request-promise-native');

const AbstractLDAPStrategy = require('./interface.js');

/**
 * Univention-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class UniventionLDAPStrategy extends AbstractLDAPStrategy {
	constructor(app, config) {
        super(app, config);
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
            attributes: ['givenName', 'sn','mailPrimaryAdress', 'mail', 'dn', 'entryUUID', 'uid', 'objectClass', 'memberOf']
        };
        const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
        return {searchString, options};
    }

    getClassesQuery(school) {
        const options = {
            filter: `ucsschoolRole=school_class:school:${school.ldapSchoolIdentifier}`,
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
        const options = this._getRequestOptions({
            uri: this.config.importUrl || process.env.NBC_IMPORTURL,
            method: 'POST',
            formData: this._generateGroupUpdateFormData(user, groups, method),
        });
        return request(options).then(response => {
            this._scheduleResponseCheck(response);
            return response;
        });
    }

    _getRequestOptions(overrides) {
        const username = this.config.importUser || process.env.NBC_IMPORTUSER;
        const password = this.config.importUserPw || process.env.NBC_IMPORTPASSWORD;
        const auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
        const REQUEST_TIMEOUT = 8000;

        const options = {
            headers: {
                'content-type': 'multipart/form-data',
                'Authorization' : auth,
            },
            json: true,
            timeout: REQUEST_TIMEOUT
        };
        return Object.assign(options, overrides);
    }

    _emitStatus(event, data={}) {
        this.app.emit(event, data);
    }

    _scheduleResponseCheck(response, timeout=2000, retries=5) {
        const status = (response.status || '').toLowerCase();
        if (status === 'finished') {
            this._emitStatus('ldap:update_user_groups:success');
            return;
        }
        const abort = status === 'failure' || status === 'aborted';
        if (retries >= 0 && !abort) {
            setTimeout(() => {
                const options = this._getRequestOptions({
                    uri: response.url,
                    method: 'GET'
                });
                request(options).then(res => {
                    this._scheduleResponseCheck(res, timeout * 4, retries - 1);
                });
            }, timeout);
        } else {
            if (abort) {
                this._emitStatus('ldap:update_user_groups:failed', {
                    response, status, retries, timeout
                });
            } else {
                this._emitStatus('ldap:update_user_groups:timeout');
            }
        }
    }
}

module.exports = UniventionLDAPStrategy;
