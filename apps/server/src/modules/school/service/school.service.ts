import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolRepo } from '@shared/repo';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School } from '@shared/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolService {
	constructor(readonly schoolRepo: SchoolRepo) {}

	async saveSchool(schoolDto: SchoolDto): Promise<SchoolDto> {
		const school: School = SchoolMapper.mapToEntity(schoolDto);
		if (school.id) {
			const entity: School = await this.schoolRepo.findById(school.id);
			SchoolMapper.mapEntityToEntity(entity, school);
			await this.schoolRepo.save(entity);
			return SchoolMapper.mapToDto(school);
		}
		return SchoolMapper.mapToDto(await this.schoolRepo.createAndSave(school));
	}
}
