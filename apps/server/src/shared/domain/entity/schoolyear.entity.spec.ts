import { schoolYearFactory } from '@testing/factory/schoolyear.factory';
import { SchoolYearEntity } from './schoolyear.entity';

describe('schoolyear entity', () => {
	describe('constructor', () => {
		describe('when creating a schoolyear', () => {
			it('should create schoolyear', () => {
				const schoolYear = schoolYearFactory.build();

				expect(/^\d{4}\/\d{2}$/.test(schoolYear.name)).toBeTruthy();
				expect(schoolYear).toBeInstanceOf(SchoolYearEntity);
			});
		});
	});
});
