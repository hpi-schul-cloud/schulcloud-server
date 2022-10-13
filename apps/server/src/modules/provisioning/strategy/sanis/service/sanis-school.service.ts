import { Injectable } from '@nestjs/common';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { EntityId, School } from '@shared/domain';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolRepo } from '@shared/repo';

@Injectable()
export class SanisSchoolService {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly schoolUc: SchoolUc,
		private readonly schoolRepo: SchoolRepo
	) {}

	async provisionSchool(data: SanisResponse, systemId: EntityId): Promise<SchoolDto> {
		const school: ProvisioningSchoolOutputDto = this.responseMapper.mapToSchoolDto(data, systemId);
		try {
			const schoolEntity: School = await this.schoolRepo.findByExternalIdOrFail(school.externalId, systemId);
			school.id = schoolEntity.id;
		} catch (e) {
			// ignore NotFoundException and create new school
		}

		const savedSchool: SchoolDto = await this.schoolUc.saveProvisioningSchoolOutputDto(school);
		return savedSchool;
	}
}
