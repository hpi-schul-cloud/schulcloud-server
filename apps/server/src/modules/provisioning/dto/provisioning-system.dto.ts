import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain/types/entity-id';

export class ProvisioningSystemDto {
	systemId: EntityId;

	provisioningStrategy: SystemProvisioningStrategy;

	provisioningUrl?: string;

	constructor(props: ProvisioningSystemDto) {
		this.systemId = props.systemId;
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}
}
