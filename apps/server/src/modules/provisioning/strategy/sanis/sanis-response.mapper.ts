import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { Injectable } from '@nestjs/common';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { EntityId } from '@shared/domain';
import {SanisResponse} from "@src/modules/provisioning/strategy/sanis/sanis.response";

@Injectable()
export class SanisResponseMapper implements IProviderResponseMapper<SanisResponse> {

	mapToSchoolDto(source: SanisResponse): ProvisioningSchoolOutputDto | undefined {
		return new ProvisioningSchoolOutputDto({
			name: source.personenkontexte[0].organisation.name
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mapToUserDto(source: SanisResponse, schoolId?: EntityId): ProvisioningUserOutputDto {
		if(source){
			return new ProvisioningUserOutputDto({
				firstName: source.person.name.vorname,
				lastName : source.person.name.familienname,
				roleNames: [],
				schoolId: schoolId as string ?? undefined,

			});
		}
		throw new Error('Method not implemented.');
	}
}
