import { SortHelper } from '@shared/common';
import { ProvisioningOptionsInterface } from '../interface';

export abstract class BaseProvisioningOptions<T extends ProvisioningOptionsInterface> {
	public isApplicable(provisioningOptions: ProvisioningOptionsInterface): provisioningOptions is T {
		const expectedKeys: string[] = Object.keys(this).sort((a, b) => SortHelper.genericSortFunction(a, b));
		const actualKeys: string[] = Object.keys(provisioningOptions).sort((a, b) => SortHelper.genericSortFunction(a, b));

		const hasProperties: boolean = JSON.stringify(expectedKeys) === JSON.stringify(actualKeys);

		return hasProperties;
	}

	abstract set(props: T): this;
}
