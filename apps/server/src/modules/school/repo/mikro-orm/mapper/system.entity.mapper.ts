import { SystemEntity } from '@shared/domain';
import { System } from '../../../domain';

export class SystemEntityMapper {
	public static mapToDo(entity: SystemEntity): System {
		const system = new System({
			id: entity.id,
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			displayName: entity.displayName,
			oauthConfig: entity.oauthConfig,
			oidcConfig: entity.oidcConfig,
			ldapConfig: entity.ldapConfig,
			provisioningStrategy: entity.provisioningStrategy,
			provisioningUrl: entity.provisioningUrl,
		});

		return system;
	}
}
