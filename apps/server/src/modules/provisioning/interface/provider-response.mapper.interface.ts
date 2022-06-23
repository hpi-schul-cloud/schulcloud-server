import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';

export interface IProviderResponseMapper {
	mapToDto(source: IProviderResponse): ProvisioningDto;
}
