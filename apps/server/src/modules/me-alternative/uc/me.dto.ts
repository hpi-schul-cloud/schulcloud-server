export class MeDto {
	constructor(id: string, firstName: string, schoolName: string) {
		this.id = id;
		this.firstName = firstName;
		this.schoolName = schoolName;
	}

	public id: string;

	public firstName: string;

	public schoolName: string;
}
