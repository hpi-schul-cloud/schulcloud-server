import { SystemForLdapLogin } from '../../domain';
import { SystemForLdapLoginResponse } from '../dto/response';

export class SystemResponseMapper {
	public static mapToLdapLoginResponses(systems: SystemForLdapLogin[]): SystemForLdapLoginResponse[] {
		const res = systems.map((system) => SystemResponseMapper.mapToLdapLoginResponse(system));

		return res;
	}

	public static mapToLdapLoginResponse(system: SystemForLdapLogin): SystemForLdapLoginResponse {
		const systemProps = system.getProps();

		const res = new SystemForLdapLoginResponse({
			id: system.id,
			type: systemProps.type,
			alias: systemProps.alias,
		});

		return res;
	}
}
