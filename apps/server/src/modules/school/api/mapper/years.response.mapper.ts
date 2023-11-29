import { School, SchoolYear } from '../../domain';
import { SchoolYearResponse, YearsResponse } from '../dto/response';
import { MissingYearsLoggableException } from '../error/missing-years.loggable-exception';

export class YearsResponseMapper {
	public static mapToResponse(school: School, schoolYears: SchoolYear[]): YearsResponse {
		const schoolYearResponses = schoolYears.map((schoolYear) => schoolYear.getProps());
		const activeYear = this.computeActiveYear(school, schoolYears);
		const nextYear = this.computeNextYear(schoolYears, activeYear);
		const lastYear = this.computeLastYear(schoolYears, activeYear);

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

	private static computeLastYear(schoolYears: SchoolYear[], activeYear: SchoolYearResponse): SchoolYearResponse {
		const oneYearAgo = new Date(new Date().setFullYear(activeYear.startDate.getFullYear() - 1));
		const lastYear = schoolYears.find(
			(schoolYear) => schoolYear.getProps().startDate <= oneYearAgo && schoolYear.getProps().endDate >= oneYearAgo
		);

		if (!lastYear) {
			throw new MissingYearsLoggableException();
		}

		const res = lastYear.getProps();

		return res;
	}

	private static computeNextYear(schoolYears: SchoolYear[], activeYear: SchoolYearResponse): SchoolYearResponse {
		const oneYearAhead = new Date(new Date().setFullYear(activeYear.startDate.getFullYear() + 1));
		const nextYear = schoolYears.find(
			(schoolYear) => schoolYear.getProps().startDate <= oneYearAhead && schoolYear.getProps().endDate >= oneYearAhead
		);

		if (!nextYear) {
			throw new MissingYearsLoggableException();
		}

		const res = nextYear.getProps();

		return res;
	}
}
