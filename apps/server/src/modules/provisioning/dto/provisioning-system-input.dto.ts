import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

export class ProvisioningSystemInputDto {
	constructor(props: ProvisioningSystemInputDto) {
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}

	provisioningStrategy: SystemProvisioningStrategy;

	provisioningUrl?: string;
}
