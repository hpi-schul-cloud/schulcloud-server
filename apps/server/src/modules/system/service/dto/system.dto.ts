import { OauthConfigDto } from '@modules/system/service/dto/oauth-config.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain/types';

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
