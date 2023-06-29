import { RoleName } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import * as roleModule from './roles';

describe('Role seed data generation', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	it('should generate role', () => {
		const roles = roleModule.generateRole();
		expect(roles).toBeDefined();
		expect(roles.length).toBeGreaterThan(0);
	});

	it('should throw if role name is undefined', () => {
		expect(() => roleModule.generateRole({})).toThrowError();
	});

	it('should throw if sub role is undefined', () => {
		const roleSeedData = {
			user: {
				id: '0000d186816abba584714c95',
				createdAt: '2017-01-01T00:06:37.148Z',
				updatedAt: '2023-04-04T12:33:09.676Z',
				name: RoleName.USER,
				roles: [],
				permissions: [],
			},
			administrator: {
				id: '0000d186816abba584714c96',
				createdAt: '2017-01-01T00:06:37.148Z',
				updatedAt: '2023-04-03T13:27:56.587Z',
				name: RoleName.ADMINISTRATOR,
				roles: [RoleName.TEAMOWNER], // <-- this is the problem
				permissions: [],
			},
		};
		expect(() => roleModule.generateRole(roleSeedData)).toThrowError();
	});
});
