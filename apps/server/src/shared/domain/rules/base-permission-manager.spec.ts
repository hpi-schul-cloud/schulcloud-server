import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { BaseDomainObject } from '../interface/base-domain-object';
import { AuthorisationUtils } from './authorisation.utils';
import { BasePermission } from './base-permission';
import { BasePermissionManager } from './base-permission-manager';
import { AuthorizationContextBuilder } from './authorization-context.builder';

class MyDomainObject extends BaseDomainObject {
	id: string;

	constructor() {
		super();
		this.id = '123';
	}
}

class MyPermission extends BasePermission<MyDomainObject> {
	public isApplicable(): boolean {
		return true;
	}

	public hasPermission(): boolean {
		return true;
	}
}

describe('base-permission', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	const permission = new MyPermission();

	class MyPermissionManager extends BasePermissionManager {
		constructor() {
			super();
			this.registerPermissions([permission]);
		}
	}

	it('Should possible to extend the abstract class', () => {
		expect(MyPermissionManager).toBeDefined();
	});

	it('Should possible to create a instance of the extender class', () => {
		const manager = new MyPermissionManager();

		expect(manager).toBeDefined();
	});

	it('Should resolve permission over hasPermission().', () => {
		const manager = new MyPermissionManager();
		const roles = [roleFactory.buildWithId()];
		const user = userFactory.buildWithId({ roles });
		const domainObject = new MyDomainObject();

		expect(manager.hasPermission(user, domainObject, AuthorizationContextBuilder.read([]))).toEqual(true);
	});

	it('Should support authorisation utils as public interface', () => {
		const manager = new MyPermissionManager();

		expect(manager).toBeInstanceOf(AuthorisationUtils);
	});
});
