import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseResponse {
	@ApiProperty({
		description: 'The id of the created course',
		type: () => String,
		readOnly: true,
	})
	courseId: string;

	constructor(props: Readonly<CreateCourseResponse>) {
		this.courseId = props.courseId;
	}
}
