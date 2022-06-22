import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.interface.strategy';
import { Inject } from '@nestjs/common';

export class ProvisioningAdapter {
	strategy: ProvisioningStrategy;

	constructor(@Inject('IProvisioningStrategy') strategy: ProvisioningStrategy) {
		this.strategy = strategy;
	}

	public setStrategy(strategy: ProvisioningStrategy) {
		this.strategy = strategy;
	}

	createSchool() {
		this.strategy.createSchool();
	}
}
