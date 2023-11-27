import { SchoolYear } from '../../domain';
import { SchoolYearResponse } from '../dto/response';

export class SchoolYearResponseMapper {
	public static mapToResponse(schoolYear: SchoolYear): SchoolYearResponse {
		const schoolYearProps = schoolYear.getProps();

		const res = new SchoolYearResponse({
			...schoolYearProps,
		});

		return res;
	}

	public static mapToResponses(schoolYears: SchoolYear[]): SchoolYearResponse[] {
		const dtos = schoolYears.map((schoolYear) => this.mapToResponse(schoolYear));

		return dtos;
	}
}
