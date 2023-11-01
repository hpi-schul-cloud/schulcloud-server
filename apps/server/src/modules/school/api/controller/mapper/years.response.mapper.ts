import { YearsDto } from '@src/modules/school/domain/dto/years.dto';
import { YearsResponse } from '../response/years.response';

export class YearsResponseMapper {
	public static mapToResponse(years: YearsDto) {
		const res = new YearsResponse(years);

		return res;
	}
}
