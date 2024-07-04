/*
import { IdentityManagementOauthService } from '@infra/identity-management';
import { Injectable } from '@nestjs/common';
import { SystemEntity } from '@shared/domain/entity';
import { SystemTypeEnum } from '@shared/domain/types';

// TODO
/!**
 * @deprecated use {@link SystemService}
 *!/
@Injectable()
export class LegacySystemService {
	constructor(private readonly idmOauthService: IdentityManagementOauthService) {}

	private async generateBrokerSystems(systems: SystemEntity[]): Promise<[] | SystemEntity[]> {
		if (!(await this.idmOauthService.isOauthConfigAvailable())) {
			return systems.filter((system) => !(system.oidcConfig && !system.oauthConfig));
		}
		const brokerConfig = await this.idmOauthService.getOauthConfig();
		let generatedSystem: SystemEntity;
		return systems.map((system) => {
			if (system.oidcConfig && !system.oauthConfig) {
				generatedSystem = new SystemEntity({
					type: SystemTypeEnum.OAUTH,
					alias: system.alias,
					displayName: system.displayName ? system.displayName : system.alias,
					provisioningStrategy: system.provisioningStrategy,
					provisioningUrl: system.provisioningUrl,
					url: system.url,
				});
				generatedSystem.id = system.id;
				generatedSystem.oauthConfig = { ...brokerConfig };
				generatedSystem.oauthConfig.idpHint = system.oidcConfig.idpHint;
				generatedSystem.oauthConfig.redirectUri += system.id;
				return generatedSystem;
			}
			return system;
		});
	}
}
*/
