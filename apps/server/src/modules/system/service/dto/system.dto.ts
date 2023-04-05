import { EntityId } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';

export class SystemDto {
	id?: EntityId;

	type: string;

	url?: string;

	alias?: string;

	displayName?: string;

	provisioningStrategy?: SystemProvisioningStrategy;

	provisioningUrl?: string;

	oauthConfig?: OauthConfigDto;

	ldapActive?: boolean;

	constructor(system: SystemDto) {
		this.id = system.id;
		this.type = system.type;
		this.url = system.url;
		this.alias = system.alias;
		this.displayName = system.displayName;
		this.provisioningStrategy = system.provisioningStrategy;
		this.provisioningUrl = system.provisioningUrl;
		this.oauthConfig = system.oauthConfig;
		this.ldapActive = system.ldapActive;
	}
}
