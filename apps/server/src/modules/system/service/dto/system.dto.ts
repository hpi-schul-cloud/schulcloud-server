import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export class SystemDto {
	type: string;

	url?: string;

	alias?: string;

	provisioningStrategy?: SystemProvisioningStrategy;

	provisioningUrl?: string;

	oauthConfig?: OauthConfigDto;

	constructor(system: SystemDto) {
		this.type = system.type;
		this.url = system.url;
		this.alias = system.alias;
		this.provisioningStrategy = system.provisioningStrategy;
		this.provisioningUrl = system.provisioningUrl;
		this.oauthConfig = system.oauthConfig;
	}
}
