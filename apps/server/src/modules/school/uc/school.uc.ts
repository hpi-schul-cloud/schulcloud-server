import { Injectable } from '@nestjs/common';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolService } from '@src/modules/school/service/school.service';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolUcMapper } from '@src/modules/school/mapper/school.uc.mapper';

@Injectable()
export class SchoolUc {
	constructor(readonly schoolService: SchoolService) {}

	async saveProvisioningSchoolOutputDto(schoolDto: ProvisioningSchoolOutputDto): Promise<SchoolDto> {
		return this.save(SchoolUcMapper.mapFromProvisioningSchoolOutputDtoToSchoolDto(schoolDto));
	}

	async save(schoolDto: SchoolDto): Promise<SchoolDto> {
		return this.schoolService.saveSchool(schoolDto);
	}
}
