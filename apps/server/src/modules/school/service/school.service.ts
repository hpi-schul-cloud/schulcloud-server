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

		let savedSchool: School;
		if (school.id) {
			savedSchool = await this.patchSchool(school);
		} else {
			savedSchool = await this.schoolRepo.createAndSave(school);
		}
		const returnSchoolDto: SchoolDto = SchoolMapper.mapToDto(savedSchool);
		return returnSchoolDto;
	}

	private async patchSchool(school: School) {
		const entity: School = await this.schoolRepo.findById(school.id);
		const patchedEntity = SchoolMapper.mapEntityToEntity(entity, school);

		await this.schoolRepo.save(patchedEntity);

		return patchedEntity;
	}
}
