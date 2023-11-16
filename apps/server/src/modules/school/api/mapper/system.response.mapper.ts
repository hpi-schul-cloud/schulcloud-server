import { System } from '../../domain';
import { SystemResponse } from '../dto/response';

export class SystemResponseMapper {
	public static mapToResponse(system: System): SystemResponse {
		const systemProps = system.getProps();

		const res = new SystemResponse({
			id: system.id,
			type: systemProps.type,
			url: systemProps.url,
			alias: systemProps.alias,
			displayName: systemProps.displayName,
			oauthConfig: systemProps.oauthConfig,
			oidcConfig: systemProps.oidcConfig,
			ldapConfig: systemProps.ldapConfig,
			provisioningStrategy: systemProps.provisioningStrategy,
			provisioningUrl: systemProps.provisioningUrl,
		});

		return res;
	}
}
