import { Role } from '@modules/role/repo';
import { SchoolEntity } from '@modules/school/repo';
import { setupEntities } from '@testing/database';
import { generateSeedData } from './generate-seed-data';
import * as roleModule from './roles';

describe('Seed Data generation', () => {
	beforeAll(async () => {
		await setupEntities([SchoolEntity, Role]);
	});

	const setup = () => {
		const injectMock = (s: string) => s;
		return generateSeedData(injectMock);
	};

	it('should generate seed data', () => {
		const seedData = setup();
		expect(seedData).toBeDefined();
		expect(seedData.length).toBe(5);
		seedData.forEach(({ data }) => {
			expect(data).toBeDefined();
			expect(data.length).toBeGreaterThan(0);
		});
	});

	it('should call generateRole', () => {
		const spy = jest.spyOn(roleModule, 'generateRole');
		const seedData = setup();
		expect(seedData).toBeDefined();
		expect(spy).toBeCalled();
	});
});
