import { School, SchoolYear } from '../../domain';
import { SchoolYearResponse, YearsResponse } from '../dto/response';
import { MissingYearsLoggableException } from '../error/missing-years.loggable-exception';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class YearsResponseMapper {
	public static mapToResponse(school: School, schoolYears: SchoolYear[]): YearsResponse {
		const activeYear = YearsResponseMapper.computeActiveYear(school, schoolYears);
		const nextYear = YearsResponseMapper.computeNextYear(schoolYears, activeYear);
		const lastYear = YearsResponseMapper.computeLastYear(schoolYears, activeYear);

		const schoolYearResponses = SchoolYearResponseMapper.mapToResponses(schoolYears);

		const res = {
			schoolYears: schoolYearResponses,
			activeYear,
			lastYear,
			nextYear,
		};

		return res;
	}

	private static computeActiveYear(school: School, schoolYears: SchoolYear[]): SchoolYearResponse {
		let activeYear = school.getProps().currentYear;

		if (!activeYear) {
			const now = new Date();
			activeYear = schoolYears.find(
				(schoolYear) => schoolYear.getProps().startDate <= now && schoolYear.getProps().endDate >= now
			);
		}

		if (!activeYear) {
			throw new MissingYearsLoggableException();
		}

		const res = SchoolYearResponseMapper.mapToResponse(activeYear);

		return res;
	}

	private static computeLastYear(schoolYears: SchoolYear[], activeYear: SchoolYearResponse): SchoolYearResponse {
		const yearBefore = activeYear.startDate.getFullYear() - 1;
		const lastYear = schoolYears.find((schoolYear) => schoolYear.getProps().startDate.getFullYear() === yearBefore);

		if (!lastYear) {
			throw new MissingYearsLoggableException();
		}

		const res = SchoolYearResponseMapper.mapToResponse(lastYear);

		return res;
	}

	private static computeNextYear(schoolYears: SchoolYear[], activeYear: SchoolYearResponse): SchoolYearResponse {
		const yearAfter = activeYear.startDate.getFullYear() + 1;
		const nextYear = schoolYears.find((schoolYear) => schoolYear.getProps().startDate.getFullYear() === yearAfter);

		if (!nextYear) {
			throw new MissingYearsLoggableException();
		}

		const res = SchoolYearResponseMapper.mapToResponse(nextYear);

		return res;
	}
}
