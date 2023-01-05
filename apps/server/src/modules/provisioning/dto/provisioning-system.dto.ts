import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain';

export class ProvisioningSystemDto {
	constructor(props: ProvisioningSystemDto) {
		this.systemId = props.systemId;
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}

	systemId: EntityId;

	provisioningStrategy: SystemProvisioningStrategy;

	provisioningUrl?: string;
}
