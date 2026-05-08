import { ProvisioningOptionsInterface } from '../interface';
import { ProvisioningOptionsType } from './provisioning-options-type';

export abstract class BaseProvisioningOptions<T extends ProvisioningOptionsInterface> {
	public isApplicable(provisioningOptions: ProvisioningOptionsInterface): provisioningOptions is T {
		const expectedKeys: Set<string> = new Set(Object.keys(this));
		const actualKeys: Set<string> = new Set(Object.keys(provisioningOptions));

		const hasProperties: boolean =
			expectedKeys.size === actualKeys.size && [...expectedKeys].every((key: string) => actualKeys.has(key));

		return hasProperties;
	}

	public abstract get getType(): ProvisioningOptionsType;

	public abstract set(props: T): this;
}
