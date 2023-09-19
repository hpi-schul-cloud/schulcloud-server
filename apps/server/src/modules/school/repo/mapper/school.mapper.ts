import { SchoolEntity } from '@shared/domain';
import { School } from '../../domain/school';

export class SchoolMapper {
	public static mapToDo(schoolEntity: SchoolEntity): School {
		const schoolProps = {
			id: schoolEntity.id,
			name: schoolEntity.name,
			officialSchoolNumber: schoolEntity.officialSchoolNumber,
		};

		const school = new School(schoolProps);

		return school;
	}
}
