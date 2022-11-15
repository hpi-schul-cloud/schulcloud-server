import { MikroORM } from '@mikro-orm/core';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { BaseDomainObject } from '../interface/base-domain-object';
import { AuthorisationUtils } from './authorisation.utils';
import { BaseRule } from './base-rule';
import { BaseRuleManager } from './base-rule-manager';
import { AuthorizationContextBuilder } from './authorization-context.builder';

class MyDomainObject extends BaseDomainObject {
	id: string;

	constructor() {
		super();
		this.id = '123';
	}
}

class MyPermission extends BaseRule<MyDomainObject> {
	public isApplicable(): boolean {
		return true;
	}

	public hasPermission(): boolean {
		return true;
	}
}

describe('base-permission', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	const permission = new MyPermission();

	class MyPermissionManager extends BaseRuleManager {
		constructor() {
			super();
			this.registerRules([permission]);
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
