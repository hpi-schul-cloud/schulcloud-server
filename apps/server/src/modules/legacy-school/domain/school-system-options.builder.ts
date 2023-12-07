import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningOptionsInterface } from '../interface';
import { InvalidProvisioningStrategyOptionsLoggableException } from '../loggable';
import { provisioningStrategyOptions } from './provisioning-strategy-options';
import { AnyProvisioningOptions } from './school-system-options.do';

export class SchoolSystemOptionsBuilder {
	constructor(private readonly provisioningStrategy: SystemProvisioningStrategy) {}

	public buildProvisioningOptions(provisioningOptions: ProvisioningOptionsInterface): AnyProvisioningOptions {
		const ProvisioningOptionsConstructor: (new () => AnyProvisioningOptions) | undefined =
			provisioningStrategyOptions.get(this.provisioningStrategy);

		if (!ProvisioningOptionsConstructor) {
			throw new InvalidProvisioningStrategyOptionsLoggableException(this.provisioningStrategy, provisioningOptions);
		}

		const createdProvisioningOptions: AnyProvisioningOptions = new ProvisioningOptionsConstructor();

		if (!createdProvisioningOptions.isApplicable(provisioningOptions)) {
			throw new InvalidProvisioningStrategyOptionsLoggableException(this.provisioningStrategy, provisioningOptions);
		}

		createdProvisioningOptions.set(provisioningOptions);

		return createdProvisioningOptions;
	}
}
