import { schoolYearEntityFactory } from '@modules/school/testing';
import { setupEntities } from '@testing/setup-entities';
import { SchoolYearEntity } from './schoolyear.entity';

describe('schoolyear entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a schoolyear', () => {
			it('should create schoolyear', () => {
				const schoolYear = schoolYearEntityFactory.build();

				expect(/^\d{4}\/\d{2}$/.test(schoolYear.name)).toBeTruthy();
				expect(schoolYear).toBeInstanceOf(SchoolYearEntity);
			});
		});
	});
});
