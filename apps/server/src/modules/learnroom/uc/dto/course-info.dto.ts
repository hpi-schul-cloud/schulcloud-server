import { EntityId } from '@shared/domain/types';
import { UserDto } from '../../../user/uc/dto/user.dto';
import { ClassInfoDto } from './class-info.dto';

export class CourseInfoDto {
	id: EntityId;

	name: string;

	teachers: UserDto[];

	classes: ClassInfoDto[];

	schoolYear?: string;

	studentCount: number;

	syncedWithGroup?: ClassInfoDto;

	constructor(props: CourseInfoDto) {
		this.id = props.id;
		this.name = props.name;
		this.classes = props.classes;
		this.teachers = props.teachers;
		this.schoolYear = props.schoolYear;
		this.studentCount = props.studentCount;
		this.syncedWithGroup = props.syncedWithGroup;
	}
}
