import { Permission } from '../interface/permission.enum';
import { Actions } from './actions.enum';
import PermissionContextBuilder from './permission-context.builder';

describe('PermissionContextBuilder', () => {
	it('Should allow to set required permissions.', () => {
		const permissionA = 'a' as Permission;
		const permissionB = 'b' as Permission;
		const context = PermissionContextBuilder.read([permissionA, permissionB]);

		expect(context.requiredPermissions).toStrictEqual([permissionA, permissionB]);
	});

	it('Should have a shorthand for read actions.', () => {
		const context = PermissionContextBuilder.read([]);

		expect(context.action).toStrictEqual(Actions.read);
	});

	it('Should have a shorthand for write actions.', () => {
		const context = PermissionContextBuilder.write([]);

		expect(context.action).toStrictEqual(Actions.write);
	});
});
