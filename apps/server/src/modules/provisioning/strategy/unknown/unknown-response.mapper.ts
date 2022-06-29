import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { UnknownResponse } from '@src/modules/provisioning/strategy/unknown/unknown.response';
import { Injectable } from '@nestjs/common';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { EntityId } from '@shared/domain';

@Injectable()
export class UnknownResponseMapper implements IProviderResponseMapper<UnknownResponse> {
	mapToSchoolDto(source: UnknownResponse): ProvisioningSchoolOutputDto | undefined {
		throw new Error('Method not implemented.');
	}

	mapToUserDto(source: UnknownResponse, schoolId?: EntityId): ProvisioningUserOutputDto {
		throw new Error('Method not implemented.');
	}
}
