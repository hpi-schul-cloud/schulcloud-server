import { SchoolYear } from '../../domain';
import { schoolFactory, schoolYearFactory } from '../../testing';
import { MissingYearsLoggableException } from '../error/missing-years.loggable-exception';
import { YearsResponseMapper } from './years.response.mapper';

describe('YearsResponseMapper', () => {
	beforeAll(() => {
		jest.useFakeTimers();
	});

	const mapToExpected = (schoolYears: SchoolYear[]) => {
		const currentYearResponse = schoolYears[1].getProps();
		const lastYearResponse = schoolYears[0].getProps();
		const nextYearResponse = schoolYears[2].getProps();
		const expected = {
			schoolYears: [lastYearResponse, currentYearResponse, nextYearResponse],
			activeYear: currentYearResponse,
			lastYear: lastYearResponse,
			nextYear: nextYearResponse,
		};

		return expected;
	};

	describe('mapToResponse', () => {
		describe('when school has current year', () => {
			const setup = () => {
				const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
				const school = schoolFactory.build({ currentYear: schoolYears[1] });

				const expected = mapToExpected(schoolYears);

				return { school, schoolYears, expected };
			};

			it('should return years response with this year set as active', () => {
				const { school, schoolYears, expected } = setup();

				const result = YearsResponseMapper.mapToResponse(school, schoolYears);

				expect(result).toStrictEqual(expected);
			});
		});

		describe('when school does not have current year', () => {
			describe('when current date is between first and last school year', () => {
				const setup = () => {
					jest.setSystemTime(new Date('2020-10-23'));

					const schoolYears = schoolYearFactory.withStartYear(2019).buildList(3);
					const school = schoolFactory.build();

					const expected = mapToExpected(schoolYears);

					return { school, schoolYears, expected };
				};

				it('should return years response according to current date', () => {
					const { school, schoolYears, expected } = setup();

					const result = YearsResponseMapper.mapToResponse(school, schoolYears);

					expect(result).toStrictEqual(expected);
				});
			});

			describe('when there is no active year', () => {
				const setup = () => {
					jest.setSystemTime(new Date('2020-10-23'));

					const lastYear = schoolYearFactory.withStartYear(2019).build();
					const nextYear = schoolYearFactory.withStartYear(2021).build();
					const school = schoolFactory.build();

					return { school, schoolYears: [lastYear, nextYear] };
				};

				it('should throw error', () => {
					const { school, schoolYears } = setup();

					expect(() => YearsResponseMapper.mapToResponse(school, schoolYears)).toThrow(MissingYearsLoggableException);
				});
			});

			describe('when there is no last year', () => {
				const setup = () => {
					jest.setSystemTime(new Date('2020-10-23'));

					const currentYear = schoolYearFactory.withStartYear(2020).build();
					const nextYear = schoolYearFactory.withStartYear(2021).build();
					const school = schoolFactory.build();

					return { school, schoolYears: [currentYear, nextYear] };
				};

				it('should throw error', () => {
					const { school, schoolYears } = setup();

					expect(() => YearsResponseMapper.mapToResponse(school, schoolYears)).toThrow(MissingYearsLoggableException);
				});
			});

			describe('when there is no next year', () => {
				const setup = () => {
					jest.setSystemTime(new Date('2020-10-23'));

					const currentYear = schoolYearFactory.withStartYear(2020).build();
					const lastYear = schoolYearFactory.withStartYear(2019).build();
					const school = schoolFactory.build();

					return { school, schoolYears: [currentYear, lastYear] };
				};

				it('should throw error', () => {
					const { school, schoolYears } = setup();

					expect(() => YearsResponseMapper.mapToResponse(school, schoolYears)).toThrow(MissingYearsLoggableException);
				});
			});
		});
	});
});
