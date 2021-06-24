import { ApiProperty } from '@nestjs/swagger';

export type RoleInfo = { name: string; id: string };
/**
 * DTO for returning a task document via api.
 */
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
}
