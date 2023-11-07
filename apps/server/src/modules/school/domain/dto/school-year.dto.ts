export class SchoolYearDto {
	constructor(props: SchoolYearDto) {
		this.id = props.id;
		this.name = props.name;
		this.startDate = props.startDate;
		this.endDate = props.endDate;
	}

	id: string;

	name: string;

	startDate: Date;

	endDate: Date;
}
