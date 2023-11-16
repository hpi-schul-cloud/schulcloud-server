import { School, SchoolYear } from '../../domain';
import { SchoolYearResponse, YearsResponse } from '../dto/response';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class YearsResponseMapper {
	public static mapToResponse(school: School, schoolYears: SchoolYear[]): YearsResponse {
		const schoolYearResponses = SchoolYearResponseMapper.mapToResponses(schoolYears);

		const activeYear = this.computeActiveYear(school, schoolYears);
		const nextYear = this.computeNextYear(schoolYears, activeYear);
		const lastYear = this.computeLastYear(schoolYears, activeYear);
		const defaultYear = activeYear || nextYear;

		const years = {
			schoolYears: schoolYearResponses,
			activeYear,
			nextYear,
			lastYear,
			defaultYear,
		};

		return years;
	}

	private static computeActiveYear(school: School, schoolYears: SchoolYear[]): SchoolYearResponse | undefined {
		let activeYear = school.getProps().currentYear;

		if (!activeYear) {
			const now = new Date();
			activeYear = schoolYears.find(
				(schoolYear) => schoolYear.getProps().startDate <= now && schoolYear.getProps().endDate >= now
			);
		}

		const dto = activeYear && SchoolYearResponseMapper.mapToResponse(activeYear);

		return dto;
	}

	private static computeNextYear(
		schoolYears: SchoolYear[],
		activeYear?: SchoolYearResponse
	): SchoolYearResponse | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const nextYear = schoolYears[indexOfActiveYear + 1];

		const dto = nextYear && SchoolYearResponseMapper.mapToResponse(nextYear);

		return dto;
	}

	private static computeLastYear(
		schoolYears: SchoolYear[],
		activeYear?: SchoolYearResponse
	): SchoolYearResponse | undefined {
		const indexOfActiveYear = schoolYears.findIndex((schoolYear) => schoolYear.id === activeYear?.id);

		const lastYear = schoolYears[indexOfActiveYear - 1];

		const dto = lastYear && SchoolYearResponseMapper.mapToResponse(lastYear);

		return dto;
	}
}
