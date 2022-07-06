import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export class ProvisioningSystemInputDto {
	constructor(props: ProvisioningSystemInputDto) {
		this.provisioningStrategy = props.provisioningStrategy;
	}

	provisioningStrategy: SystemProvisioningStrategy;
}
