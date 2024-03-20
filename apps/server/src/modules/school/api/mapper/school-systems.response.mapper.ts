import { System } from '@src/modules/system';
import { SystemForLdapLogin } from '../../domain';
import { SchoolSystemResponse, SystemForLdapLoginResponse } from '../dto/response';

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

	public static mapToSchoolSystemResponse(systems: System[]): SchoolSystemResponse[] {
		const systemsDto = systems.map((system) => new SchoolSystemResponse(system.getProps()));

		return systemsDto;
	}
}
