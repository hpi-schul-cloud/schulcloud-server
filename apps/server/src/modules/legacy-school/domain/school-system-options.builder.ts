import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningOptionsInterface } from '../interface';
import {
	ProvisioningStrategyInvalidOptionsLoggableException,
	ProvisioningStrategyNoOptionsLoggableException,
} from '../loggable';
import { provisioningStrategyOptions } from './provisioning-strategy-options';
import { AnyProvisioningOptions } from './school-system-options.do';

export class SchoolSystemOptionsBuilder {
	constructor(private readonly provisioningStrategy: SystemProvisioningStrategy) {}

	public getDefaultProvisioningOptions(): AnyProvisioningOptions {
		const ProvisioningOptionsConstructor: (new () => AnyProvisioningOptions) | undefined =
			provisioningStrategyOptions.get(this.provisioningStrategy);

		if (!ProvisioningOptionsConstructor) {
			throw new ProvisioningStrategyNoOptionsLoggableException(this.provisioningStrategy);
		}

		const createdProvisioningOptions: AnyProvisioningOptions = new ProvisioningOptionsConstructor();

		return createdProvisioningOptions;
	}

	public buildProvisioningOptions(provisioningOptions: ProvisioningOptionsInterface): AnyProvisioningOptions {
		const createdProvisioningOptions: AnyProvisioningOptions = this.getDefaultProvisioningOptions();

		if (!createdProvisioningOptions.isApplicable(provisioningOptions)) {
			throw new ProvisioningStrategyInvalidOptionsLoggableException(this.provisioningStrategy, provisioningOptions);
		}

		createdProvisioningOptions.set(provisioningOptions);

		return createdProvisioningOptions;
	}
}
