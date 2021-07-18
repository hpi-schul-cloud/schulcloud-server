import { ApiProperty } from '@nestjs/swagger';

export type RoleInfo = { name: string; id: string };

type ResolvedUserProperties = {
	firstName: string;
	lastName: string;
	roles: RoleInfo[];
	permissions: string[];
	schoolId: string;
};

export class ResolvedUser {
	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty()
	id: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	roles: RoleInfo[];

	@ApiProperty()
	permissions: string[];

	@ApiProperty()
	schoolId: string;

	constructor(props: ResolvedUserProperties) {
		Object.assign(this, props);
	}
}
