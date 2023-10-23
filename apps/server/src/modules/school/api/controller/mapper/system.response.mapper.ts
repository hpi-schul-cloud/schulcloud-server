import { SystemDto } from '../../../domain';
import { SystemResponse } from '../response';

export class SystemResponseMapper {
	public static mapToResponse(system: SystemDto): SystemResponse {
		const res = new SystemResponse(system);

		return res;
	}
}
