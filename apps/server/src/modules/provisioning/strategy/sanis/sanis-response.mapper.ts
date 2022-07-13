import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { Injectable } from '@nestjs/common';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { EntityId } from '@shared/domain';
import { PlaceholderResponse } from '@src/modules/provisioning/strategy/placeholder/placeholder.response';

@Injectable()
export class SanisResponseMapper implements IProviderResponseMapper<PlaceholderResponse> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mapToSchoolDto(source: PlaceholderResponse): ProvisioningSchoolOutputDto | undefined {
		throw new Error('Method not implemented.');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mapToUserDto(source: PlaceholderResponse, schoolId?: EntityId): ProvisioningUserOutputDto {
		throw new Error('Method not implemented.');
	}
}
