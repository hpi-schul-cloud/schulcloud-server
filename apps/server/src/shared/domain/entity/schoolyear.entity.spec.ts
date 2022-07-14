import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { SchoolYear } from './schoolyear.entity';

describe('schoolyear entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		describe('when creating a schoolyear', () => {
			it('should create schoolyear', () => {
				const schoolYear = schoolYearFactory.build();

				expect(/^\d{4}\/\d{2}$/.test(schoolYear.name)).toBeTruthy();
				expect(schoolYear).toBeInstanceOf(SchoolYear);
			});
		});
	});
});
