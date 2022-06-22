import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolRepo } from '@shared/repo';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School } from '@shared/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolService {
	constructor(readonly schoolRepo: SchoolRepo) {}

	async saveSchool(schoolDto: SchoolDto) {
		let school: School = SchoolMapper.mapToEntity(schoolDto);
		if (schoolDto.id) {
			school = await this.updateSchool(schoolDto.id, school);
		}
		await this.schoolRepo.save(school);
	}

	private async updateSchool(targetSchoolId: string, sourceSchool: School): Promise<School> {
		const targetSchoolEntity: School = await this.schoolRepo.findById(targetSchoolId);
		return SchoolMapper.mapEntityToEntity(targetSchoolEntity, sourceSchool);
	}
}
