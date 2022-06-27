import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

export abstract class ProvisioningStrategy<T extends IProviderResponse> {
	protected constructor(private readonly responseMapper: IProviderResponseMapper<T>) {}

	abstract getProvisioningData(): Promise<T>;

	async apply(): Promise<ProvisioningDto> {
		const provisioningData: T = await this.getProvisioningData();
		return this.responseMapper.mapToDto(provisioningData);
	}
}
