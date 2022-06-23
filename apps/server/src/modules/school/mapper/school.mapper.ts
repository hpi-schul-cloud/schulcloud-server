import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { School } from '@shared/domain';

export class SchoolMapper {
	static mapToEntity(schoolDto: SchoolDto): School {
		const school = new School({
			name: schoolDto.name,
		});
		if (schoolDto.id) {
			school.id = schoolDto.id;
		}
		return school;
	}

	static mapEntityToEntity(target: School, source: School): School {
		target.id = source.id;
		target.name = source.name;
		return target;
	}
}
