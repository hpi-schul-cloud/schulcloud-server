import { System } from '../do';
import { SystemDto } from '../dto';

export class SystemMapper {
	public static mapToDto(system: System): SystemDto {
		const systemProps = system.getProps();

		const dto = new SystemDto({
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

		return dto;
	}
}
