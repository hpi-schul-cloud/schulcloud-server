const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { NotAuthenticated } = reqlib('src/errors');
const LDAPConnectionError = require('../../../src/services/ldap/LDAPConnectionError');

const errorHandlers = require('../../../src/services/ldap-config/errors');

describe('ldap-config error handlers', () => {
	it('should offer an array of objects of the correct form', () => {
		expect(errorHandlers).to.be.instanceOf(Array);
		for (const item of errorHandlers) {
			['match', 'type', 'message'].forEach((property) => {
				expect(item).to.haveOwnProperty(property);
			});
			expect(item.match).to.be.instanceOf(Function);
			expect(typeof item.type).to.equal('string');
			expect(item.message).to.be.instanceOf(Function);
		}
	});

	describe('WRONG_CREDENTIALS', () => {
		const [handler] = errorHandlers.filter((eh) => eh.type === 'WRONG_CREDENTIALS');

		it('should exist', () => {
			expect(handler).to.exist;
		});

		it('should match NotAuthenticated errors', () => {
			expect(handler.match(new NotAuthenticated())).to.equal(true);
		});

		it('should not match anything else', () => {
			expect(handler.match(new Error())).to.equal(false);
			expect(handler.match(new LDAPConnectionError())).to.equal(false);
			expect(handler.match()).to.equal(false);
			expect(handler.match(null)).to.equal(false);
		});
	});

	describe('CONNECTION_ERROR', () => {
		const [handler] = errorHandlers.filter((eh) => eh.type === 'CONNECTION_ERROR');

		it('should exist', () => {
			expect(handler).to.exist;
		});

		it('should match LDAPConnectionError errors', () => {
			expect(handler.match(new LDAPConnectionError())).to.equal(true);
		});

		it('should not match anything else', () => {
			expect(handler.match(new Error())).to.equal(false);
			expect(handler.match(new NotAuthenticated())).to.equal(false);
			expect(handler.match()).to.equal(false);
			expect(handler.match(null)).to.equal(false);
		});
	});

	describe('WRONG_SEARCH_PATH', () => {
		const [handler] = errorHandlers.filter((eh) => eh.type === 'WRONG_SEARCH_PATH');

		it('should exist', () => {
			expect(handler).to.exist;
		});

		it('should match "No Such Object" LDAP errors', () => {
			expect(
				handler.match({
					lde_message: 'No Such Object',
					lde_path: '',
					dn: 'ou=users',
				})
			).to.equal(true);
		});

		it('should not match anything else', () => {
			expect(handler.match(new Error())).to.equal(false);
			expect(handler.match(new LDAPConnectionError())).to.equal(false);
			expect(
				handler.match({
					lde_message: 'Wrong credentials',
					lde_path: '',
					dn: 'cn=admin,dc=example,dc=org',
				})
			).to.equal(false);
		});
	});

	describe('INVALID_CONFIGURATION_OBJECT', () => {
		const [handler] = errorHandlers.filter((eh) => eh.type === 'INVALID_CONFIGURATION_OBJECT');

		it('should exist', () => {
			expect(handler).to.exist;
		});

		it('should match LDAPConnectionError errors', () => {
			expect(handler.match(new Error('Invalid configuration object'))).to.equal(true);
		});

		it('should not match anything else', () => {
			expect(handler.match(new Error())).to.equal(false);
			expect(handler.match(new LDAPConnectionError())).to.equal(false);
		});
	});
});
