import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseResponse {
	@ApiProperty({
		description: 'The id of the created course',
		type: () => String,
		readOnly: true,
	})
	public courseId: string;

	constructor(props: Readonly<CreateCourseResponse>) {
		this.courseId = props.courseId;
	}
}
