import {ProvisioningSchoolOutputDto} from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import {ProvisioningUserOutputDto} from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import {EntityId} from '@shared/domain';

export interface IProviderResponseMapper<T> {
	mapToSchoolDto(source: T): ProvisioningSchoolOutputDto | undefined;

	mapToUserDto(source: T, schoolId?: EntityId): ProvisioningUserOutputDto;
}
