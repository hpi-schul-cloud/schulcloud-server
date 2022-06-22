import { IProviderResponse } from '@src/modules/provisioning/strategy/provider.response';
import { ProvisioningDto } from '@src/modules/provisioning/service/dto/provisioning.dto';

export interface IProviderResponseMapper {
	mapToDto(source: IProviderResponse): ProvisioningDto;
}
