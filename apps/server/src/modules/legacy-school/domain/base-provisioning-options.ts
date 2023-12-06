import { ProvisioningOptionsInterface } from '../interface';

export abstract class BaseProvisioningOptions<T extends ProvisioningOptionsInterface> {
	public isApplicable(provisioningOptions: ProvisioningOptionsInterface): provisioningOptions is T {
		const hasProperties: boolean = Object.keys(provisioningOptions).sort() === Object.keys(this).sort();

		return hasProperties;
	}

	abstract set(props: T): this;
}
