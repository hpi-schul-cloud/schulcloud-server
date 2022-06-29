import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { EntityId } from '@shared/domain';

export interface IProviderResponseMapper<T extends IProviderResponse> {
	mapToSchoolDto(source: T): ProvisioningSchoolOutputDto | undefined;

	mapToUserDto(source: T, schoolId?: EntityId): ProvisioningUserOutputDto;
}
