import { schoolYearEntityFactory } from '../testing';
import { SchoolYearEntity } from './school-year.entity';

describe('schoolyear entity', () => {
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
