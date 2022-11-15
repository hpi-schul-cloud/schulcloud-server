import { BaseDomainObject } from '../interface/base-domain-object';
import { AuthorisationUtils } from './authorisation.utils';
import { BaseRule } from './base-rule';

class MyDomainObject extends BaseDomainObject {
	id: string;

	constructor() {
		super();
		this.id = '123';
	}
}

describe('base-permission', () => {
	class MyPermission extends BaseRule<MyDomainObject> {
		public isApplicable(): boolean {
			return true;
		}

		public hasPermission(): boolean {
			return true;
		}
	}

	it('Should possible to extend the abstract class', () => {
		expect(MyPermission).toBeDefined();
	});

	it('Should possible to create a instance of the extender class', () => {
		const permission = new MyPermission();

		expect(permission).toBeDefined();
	});

	it('Should resolve condition check over isApplicable().', () => {
		const permission = new MyPermission();

		expect(permission.isApplicable()).toEqual(true);
	});

	it('Should resolve permission over hasPermission().', () => {
		const permission = new MyPermission();

		expect(permission.hasPermission()).toEqual(true);
	});

	it('Should support authorisation utils.', () => {
		const permission = new MyPermission();

		expect(permission.utils).toBeInstanceOf(AuthorisationUtils);
	});
});
