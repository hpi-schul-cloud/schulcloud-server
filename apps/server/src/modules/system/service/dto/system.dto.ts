import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain';

export class SystemDto {
	constructor(system: SystemDto) {
		this.id = system.id;
		this.type = system.type;
		this.url = system.url;
		this.alias = system.alias;
		this.provisioningStrategy = system.provisioningStrategy;
		this.oauthConfig = system.oauthConfig;
	}

	id?: EntityId;

	type: string;

	url?: string;

	alias?: string;

	provisioningStrategy?: SystemProvisioningStrategy;

	oauthConfig?: OauthConfigDto;
}
