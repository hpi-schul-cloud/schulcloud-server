import { SchoolYearDto } from '../../../domain';
import { SchoolYearResponse } from '../response';

export class SchoolYearMapper {
	public static mapToResponse(schoolYear: SchoolYearDto): SchoolYearResponse {
		const res = new SchoolYearResponse(schoolYear);

		return res;
	}
}
