export class CreateCourseDto {
	public name!: string;

	public color?: string;

	constructor(props: CreateCourseDto) {
		Object.assign(this, props);
	}
}
