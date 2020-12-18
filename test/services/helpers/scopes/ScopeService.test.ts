import { expect } from 'chai';
import {
	ScopeListService,
	ScopeMembersService,
	ScopePermissionService,
	ScopeService,
} from '../../../../src/services/helpers/scopePermissions';

describe('ScopeService', () => {
	it('should work', () => expect(ScopeService).to.be.ok);

	describe('#initialize', () => {
		it('should throw an error if no permission handler is provided', () => {
			expect(() => ScopeService.initialize({}, 'path')).to.throw(Error);
		});

		it('should register a new ScopeService instance at the provided path', () => {
			const SERVICE_PATH = 'lollipop';
			const fakeApp = {
				use: (path, service) => {
					expect(path).to.equal(SERVICE_PATH);
					expect(service).to.be.instanceOf(ScopeService);
				},
				service: () => ({
					hooks: () => true,
				}),
			};
			expect(() => ScopeService.initialize(fakeApp, SERVICE_PATH, () => true)).not.to.throw(Error);
		});

		it('should return an instance of the provided subclass', () => {
			const SERVICE_PATH = 'lollipop';
			let registeredService;
			const fakeApp = {
				use: (_path, service) => {
					registeredService = service;
					return true;
				},
				service: () => ({
					hooks: () => true,
				}),
			};

			[ScopeService, ScopePermissionService, ScopeListService, ScopeMembersService].forEach((klass) => {
				klass.initialize(fakeApp, SERVICE_PATH, () => true);
				expect(registeredService).to.be.instanceOf(klass);
			});
		});
	});
});
