import { Permission } from '@shared/domain/interface';

export class MeDto {
	constructor(id: string, firstName: string, schoolName: string, permissions: Permission[]) {
		this.id = id;
		this.firstName = firstName;
		this.schoolName = schoolName;
		this.permissions = permissions;
	}

	public id: string;

	public firstName: string;

	public schoolName: string;

	public permissions: Permission[];
}
