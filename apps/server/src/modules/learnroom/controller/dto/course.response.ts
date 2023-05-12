import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Course, UsersList } from '@shared/domain';

export class CourseResponse {
	constructor(course: Course) {
		this.id = course.id;
		this.title = course.name;
		if (course.startDate) {
			this.startDate = course.startDate;
		}
		if (course.untilDate) {
			this.untilDate = course.untilDate;
		}
		if (course.students) {
			this.students = course.getStudentsList();
		}
	}

	@ApiProperty({
		description: 'The id of the Grid element',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Title of the Grid element',
	})
	title: string;

	@ApiPropertyOptional({
		description: 'Start date of the course',
	})
	startDate?: Date;

	@ApiPropertyOptional({
		description: 'End date of the course. After this the course counts as archived',
	})
	untilDate?: Date;

	@ApiPropertyOptional({
		description: 'List of students enrolled in course',
		type: [UsersList],
	})
	students?: UsersList[];
}
