import { System } from '@src/modules/system';
import { SystemForLdapLogin } from '../../domain';
import { ProviderConfigResponse, SchoolSystemResponse, SystemForLdapLoginResponse } from '../dto/response';

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
		const systemsDto = systems.map((system) => {
			const params = this.prepareParams(system);
			const schoolSystemResponse = new SchoolSystemResponse(params);

			return schoolSystemResponse;
		});

		return systemsDto;
	}

	private static prepareParams(system: System): SchoolSystemResponse {
		const { ldapConfig, oauthConfig } = system.getProps();
		const params = {
			...system.getProps(),
			ldapConfig: ldapConfig ? new ProviderConfigResponse(ldapConfig) : undefined,
			oauthConfig: oauthConfig ? new ProviderConfigResponse(oauthConfig) : undefined,
		};

		return params;
	}
}
