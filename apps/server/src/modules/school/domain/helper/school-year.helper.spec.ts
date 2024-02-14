import { schoolFactory, schoolYearFactory } from '../../testing';
import { MissingYearsLoggableException } from '../error';
import { SchoolYearHelper } from './school-year.helper';

describe('SchoolYearHelper', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2020-10-23'));
	});

	describe('computeActiveAndLastAndNextYear', () => {
		describe('when all needed years exist', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
				const school = schoolFactory.build({ currentYear: schoolYears[1] });

				return { school, schoolYears };
			};

			it('should return all years', () => {
				const { school, schoolYears } = setup();

				const result = SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears);

				expect(result).toStrictEqual({
					activeYear: schoolYears[1],
					lastYear: schoolYears[0],
					nextYear: schoolYears[2],
				});
			});
		});

		describe('when a needed year is missing', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(2);
				const school = schoolFactory.build();

				return { school, schoolYears };
			};

			it('should throw error', () => {
				const { school, schoolYears } = setup();

				expect(() => SchoolYearHelper.computeActiveAndLastAndNextYear(school, schoolYears)).toThrow(
					MissingYearsLoggableException
				);
			});
		});
	});

	describe('computeActiveYear', () => {
		describe('when school has a current year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
				const school = schoolFactory.build({ currentYear: schoolYears[1] });

				return { school, schoolYears };
			};

			it('should return this current year', () => {
				const { school, schoolYears } = setup();

				const result = SchoolYearHelper.computeActiveYear(school, schoolYears);

				expect(result).toStrictEqual(schoolYears[1]);
			});
		});

		describe('when school does not have a current year', () => {
			describe('when there exists a fitting year', () => {
				const setup = () => {
					const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
					const school = schoolFactory.build();

					return { school, schoolYears };
				};

				it('should return active year according to current date', () => {
					const { school, schoolYears } = setup();

					const result = SchoolYearHelper.computeActiveYear(school, schoolYears);

					expect(result).toStrictEqual(schoolYears[1]);
				});
			});

			describe('when there exists no fitting year', () => {
				const setup = () => {
					const schoolYears = schoolYearFactory.withStartYear(2012).buildList(3);
					const school = schoolFactory.build();

					return { school, schoolYears };
				};

				it('should throw error', () => {
					const { school, schoolYears } = setup();

					expect(() => SchoolYearHelper.computeActiveYear(school, schoolYears)).toThrow(MissingYearsLoggableException);
				});
			});
		});
	});

	describe('computeLastYear', () => {
		describe('when there exists a fitting year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
				const activeYear = schoolYears[1];

				return { schoolYears, activeYear };
			};

			it('should return last year', () => {
				const { schoolYears, activeYear } = setup();

				const result = SchoolYearHelper.computeLastYear(schoolYears, activeYear);

				expect(result).toStrictEqual(schoolYears[0]);
			});
		});

		describe('when there exists no fitting year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2012).buildList(3);
				const activeYear = schoolYears[0];

				return { schoolYears, activeYear };
			};

			it('should throw error', () => {
				const { schoolYears, activeYear } = setup();

				expect(() => SchoolYearHelper.computeLastYear(schoolYears, activeYear)).toThrow(MissingYearsLoggableException);
			});
		});
	});

	describe('computeNextYear', () => {
		describe('when there exists a fitting year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
				const activeYear = schoolYears[1];

				return { schoolYears, activeYear };
			};

			it('should return next year', () => {
				const { schoolYears, activeYear } = setup();

				const result = SchoolYearHelper.computeNextYear(schoolYears, activeYear);

				expect(result).toStrictEqual(schoolYears[2]);
			});
		});

		describe('when there exists no fitting year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2012).buildList(3);
				const activeYear = schoolYears[2];

				return { schoolYears, activeYear };
			};

			it('should throw error', () => {
				const { schoolYears, activeYear } = setup();

				expect(() => SchoolYearHelper.computeNextYear(schoolYears, activeYear)).toThrow(MissingYearsLoggableException);
			});
		});
	});
});
