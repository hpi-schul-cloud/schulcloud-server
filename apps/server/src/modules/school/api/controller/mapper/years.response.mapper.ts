import { YearsDto } from '../../../domain';
import { YearsResponse } from '../response/years.response';

export class YearsResponseMapper {
	public static mapToResponse(years: YearsDto) {
		const res = new YearsResponse(years);

		return res;
	}
}
