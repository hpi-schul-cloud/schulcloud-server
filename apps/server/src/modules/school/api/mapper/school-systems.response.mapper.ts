import { System } from '@src/modules/system';
import { School, SystemForLdapLogin } from '../../domain';
import { SchoolSystemResponse, SchoolSystemsResponse, SystemForLdapLoginResponse } from '../dto/response';

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

	public static mapToSchoolSystemsResponse(school: School, systems: System[]): SchoolSystemsResponse {
		const systemsDto = systems.map((system) => new SchoolSystemResponse(system.getProps()));

		const res = new SchoolSystemsResponse({
			id: school.id,
			systems: systemsDto,
		});

		return res;
	}
}
