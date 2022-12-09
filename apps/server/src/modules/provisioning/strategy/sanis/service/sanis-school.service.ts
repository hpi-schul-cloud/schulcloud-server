import { Injectable } from '@nestjs/common';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { EntityId, School } from '@shared/domain';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolRepo } from '@shared/repo';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '../../../../school';

@Injectable()
export class SanisSchoolService {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly schoolService: SchoolService,
		private readonly schoolRepo: SchoolRepo
	) {}

	async provisionSchool(data: SanisResponse, systemId: EntityId): Promise<SchoolDto> {
		const school: ProvisioningSchoolOutputDto = this.responseMapper.mapToSchoolDto(data, systemId);
		const schoolDo: SchoolDO | null = await this.schoolRepo.findByExternalId(school.externalId, systemId);
		school.id = schoolDo ? schoolDo.id : undefined;
		const savedSchool: SchoolDto = await this.schoolService.saveProvisioningSchoolOutputDto(school);
		return savedSchool;
	}
}
