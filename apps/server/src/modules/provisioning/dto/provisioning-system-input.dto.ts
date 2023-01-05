import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain';

export class ProvisioningSystemInputDto {
	constructor(props: ProvisioningSystemInputDto) {
		this.systemId = props.systemId;
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}

	systemId: EntityId;

	provisioningStrategy: SystemProvisioningStrategy;

	provisioningUrl?: string;
}
