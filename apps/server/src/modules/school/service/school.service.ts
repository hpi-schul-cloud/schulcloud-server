import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolRepo } from '@shared/repo';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School } from '@shared/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolService {
	constructor(readonly schoolRepo: SchoolRepo) {}

	async createOrUpdateSchool(schoolDto: SchoolDto): Promise<SchoolDto> {
		const school: School = SchoolMapper.mapToEntity(schoolDto);

		let createdSchool: School;
		if (school.id) {
			createdSchool = await this.patchSchool(school);
		} else {
			createdSchool = this.schoolRepo.create(school);
			await this.schoolRepo.save(school);
		}
		const returnSchoolDto: SchoolDto = SchoolMapper.mapToDto(createdSchool);
		return returnSchoolDto;
	}

	private async patchSchool(school: School) {
		const entity: School = await this.schoolRepo.findById(school.id);
		const patchedEntity = SchoolMapper.mapEntityToEntity(entity, school);

		await this.schoolRepo.save(patchedEntity);

		return patchedEntity;
	}
}
