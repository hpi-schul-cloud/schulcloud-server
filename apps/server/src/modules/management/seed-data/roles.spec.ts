import { setupEntities } from '@shared/testing';
import * as roleModule from './roles';

describe('Role seed data generation', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	const setup = () => {};

	it('should throw if role name is undefined', () => {
		const seedData = setup();
		const role = roleModule.generateRole();
		console.log(role);
	});
});
