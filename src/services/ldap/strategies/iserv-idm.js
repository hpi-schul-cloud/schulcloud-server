const AbstractLDAPStrategy = require('./interface.js');

/**
 * iServ-IDM-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class IservIdmLDAPStrategy extends AbstractLDAPStrategy {
	/**
     * @see AbstractLDAPStrategy#getSchools
     * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
     */
	async getSchools() {
		const options = {
			filter: 'objectClass=organization',
			scope: 'sub',
			attributes: ['description', 'o', 'dc', 'dn'],
		};
		const schools = await this.app.service('ldap').searchCollection(this.config, '', options);
		return schools.map((idmSchool) => ({
			ldapOu: idmSchool.dn,
			displayName: idmSchool.description || idmSchool.o,
		}));
	}

	/**
     * @see AbstractLDAPStrategy#getUsers
     * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
     * (Array) roles = ['teacher', 'student', 'administrator']
     */
	async getUsers(school) {
		const options = {
			filter: '(&(objectClass=person)(sn=*)(uuid=*)(uid=*)(mail=*)(cn=*))',
			scope: 'sub',
			attributes: ['givenName', 'sn', 'dn', 'uuid', 'cn', 'mail', 'objectClass', 'memberOf'],
		};
		const searchString = `ou=users,${school.ldapSchoolIdentifier}`;
		const data = await this.app.service('ldap').searchCollection(this.config, searchString, options);

		const teacherRegex = /^cn=ROLE_TEACHER|^cn=ROLE_LEHRER/;
		const adminRegex = /^cn=ROLE_ADMIN/;

		const results = [];
		data.forEach((obj) => {
			const memberships = Array.isArray(obj.memberOf) ? obj.memberOf : [obj.memberOf];
			const roles = [];

			if (memberships.some((m) => teacherRegex.test(m))) {
				if (!obj.givenName) {
					obj.givenName = 'Lehrkraft';
				}
				roles.push('teacher');
			}
			if (memberships.some((m) => adminRegex.test(m))) {
				if (!obj.givenName) {
					obj.givenName = 'Admin';
				}
				roles.push('administrator');
			}
			if (roles.length === 0) {
				if (!obj.givenName) {
					obj.givenName = 'Schüler:in';
				}
				roles.push('student');
			}

			if (!memberships.some((item) => item === 'ROLE_NO_SC')) {
				results.push({
					email: obj.mail,
					firstName: obj.givenName,
					lastName: obj.sn,
					roles,
					ldapDn: obj.dn,
					ldapUUID: obj.uuid,
					ldapUID: obj.cn,
				});
			}
		});
		return results;
	}

	/**
     * @see AbstractLDAPStrategy#getClasses
     * @returns {Array} Array of Objects containing className, ldapDn, uniqueMembers
     */
	async getClasses(school) {
		const options = {
			filter: 'description=*',
			scope: 'sub',
			attributes: ['dn', 'description', 'member'],
		};
		const searchString = `ou=groups,${school.ldapSchoolIdentifier}`;
		const data = await this.app.service('ldap').searchCollection(this.config, searchString, options);

		return data.map((obj) => ({
			className: obj.description,
			ldapDn: obj.dn,
			uniqueMembers: obj.member,
		}));
	}
}

module.exports = IservIdmLDAPStrategy;
