import { Permission } from '@shared/domain/interface';
import { Action } from '../type';
import { AuthorizationContextBuilder } from './authorization-context.builder';

describe('AuthorizationContextBuilder', () => {
	it('Should allow to set required permissions.', () => {
		const permissionA = 'a' as Permission;
		const permissionB = 'b' as Permission;
		const context = AuthorizationContextBuilder.read([permissionA, permissionB]);

		expect(context.requiredPermissions).toStrictEqual([permissionA, permissionB]);
	});

	it('Should have a shorthand for read actions.', () => {
		const context = AuthorizationContextBuilder.read([]);

		expect(context.action).toStrictEqual(Action.read);
	});

	it('Should have a shorthand for write actions.', () => {
		const context = AuthorizationContextBuilder.write([]);

		expect(context.action).toStrictEqual(Action.write);
	});
});
