const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { Forbidden, BadRequest } = require('@feathersjs/errors');
const { ScopePermissionService } = require('../../../../src/services/helpers/scopePermissions');

describe('ScopePermissionService', () => {
	it('should work', () => expect(ScopePermissionService).to.be.ok);

	describe('#initialize', () => {
		it('should throw an error if no permission handler is provided', () => {
			expect(() => ScopePermissionService.initialize({}, 'path')).to.throw(Error);
		});

		it('should register a new ScopePermissionService instance at the provided path', () => {
			const SERVICE_PATH = 'lollipop';
			const fakeApp = {
				use: (path, service) => {
					expect(path).to.equal(SERVICE_PATH);
					expect(service).to.be.instanceOf(ScopePermissionService);
				},
			};
			expect(() => ScopePermissionService.initialize(fakeApp, SERVICE_PATH, () => true)).not.to.throw;
		});
	});
});
