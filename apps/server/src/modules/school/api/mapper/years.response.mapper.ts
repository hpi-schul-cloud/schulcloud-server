import { SchoolYear } from '../../domain';
import { YearsResponse } from '../dto/response';
import { SchoolYearResponseMapper } from './school-year.response.mapper';

export class YearsResponseMapper {
	public static mapToResponse(
		schoolYears: SchoolYear[],
		activeYear: SchoolYear,
		lastYear: SchoolYear,
		nextYear: SchoolYear
	): YearsResponse {
		const res = new YearsResponse({
			schoolYears: SchoolYearResponseMapper.mapToResponses(schoolYears),
			activeYear: SchoolYearResponseMapper.mapToResponse(activeYear),
			lastYear: SchoolYearResponseMapper.mapToResponse(lastYear),
			nextYear: SchoolYearResponseMapper.mapToResponse(nextYear),
		});

		return res;
	}
}
