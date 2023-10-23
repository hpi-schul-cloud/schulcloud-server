import { SchoolYearDto } from '../../../domain';
import { SchoolYearResponse } from '../response';

export class SchoolYearResponseMapper {
	public static mapToResponse(schoolYear: SchoolYearDto): SchoolYearResponse {
		const res = new SchoolYearResponse(schoolYear);

		return res;
	}
}
