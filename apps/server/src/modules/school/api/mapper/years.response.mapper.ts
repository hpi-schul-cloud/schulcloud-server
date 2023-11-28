import { School, SchoolYear } from '../../domain';
import { SchoolYearResponse, YearsResponse } from '../dto/response';
import { MissingYearsLoggableException } from '../error/missing-years.loggable-exception';

export class YearsResponseMapper {
	public static mapToResponse(school: School, schoolYears: SchoolYear[]): YearsResponse {
		const sortedSchoolYears = schoolYears.sort(
			(a, b) => a.getProps().startDate.getTime() - b.getProps().startDate.getTime()
		);

		const schoolYearResponses = sortedSchoolYears.map((schoolYear) => schoolYear.getProps());
		const activeYear = this.computeActiveYear(school, sortedSchoolYears);
		const nextYear = this.computeNextYear(sortedSchoolYears, activeYear);
		const lastYear = this.computeLastYear(sortedSchoolYears, activeYear);

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

		const res = activeYear.getProps();

		return res;
	}

	private static computeLastYear(schoolYears: SchoolYear[], activeYear?: SchoolYearResponse): SchoolYearResponse {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const lastYear = schoolYears[indexOfActiveYear - 1];

		if (!lastYear) {
			throw new MissingYearsLoggableException();
		}

		const res = lastYear.getProps();

		return res;
	}

	private static computeNextYear(schoolYears: SchoolYear[], activeYear?: SchoolYearResponse): SchoolYearResponse {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const nextYear = schoolYears[indexOfActiveYear + 1];

		if (!nextYear) {
			console.log('nextYear', nextYear);
			throw new MissingYearsLoggableException();
		}

		const res = nextYear.getProps();

		return res;
	}
}
