import { ProvisioningDto } from '@src/modules/provisioning/service/dto/provisioning.dto';
import { IProviderResponse } from '@src/modules/provisioning/strategy/provider.response';
import { IProviderResponseMapper } from '@src/modules/provisioning/strategy/provider-response.mapper';

export abstract class ProvisioningStrategy {
	protected constructor(readonly responseMapper: IProviderResponseMapper) {}

	// TODO do we need this?
	abstract strategySpecific(provisioningDto: ProvisioningDto): void;

	abstract getProvisioningData(): IProviderResponse;

	apply(): ProvisioningDto {
		const provisioningData: IProviderResponse = this.getProvisioningData();
		const provisioningDto: ProvisioningDto = this.responseMapper.mapToDto(provisioningData);

		this.strategySpecific(provisioningDto);

		return provisioningDto;
	}
}
