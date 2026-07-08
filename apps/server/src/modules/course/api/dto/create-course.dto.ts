export class CreateCourseDto {
	name!: string;

	color?: string;

	constructor(props: CreateCourseDto) {
		Object.assign(this, props);
	}
}
