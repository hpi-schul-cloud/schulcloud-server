import { System } from '../../domain';
import { SystemResponse } from '../dto/response';

export class SystemResponseMapper {
	public static mapToResponse(system: System): SystemResponse {
		const systemProps = system.getProps();

		const res = new SystemResponse({
			...systemProps,
		});

		return res;
	}
}
