export class SchoolYearDto {
	constructor({ id, name, startDate, endDate }: SchoolYearDto) {
		this.id = id;
		this.name = name;
		this.startDate = startDate;
		this.endDate = endDate;
	}

	id: string;

	name: string;

	startDate: Date;

	endDate: Date;
}
