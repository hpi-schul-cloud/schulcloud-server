import { ApiProperty } from '@nestjs/swagger';
// invalid import
import { IResolvedUser, IRole } from '@src/modules/authentication/interface';

export type Role = IRole;

export class ResolvedUserResponse implements IResolvedUser {
	@ApiProperty()
	firstName!: string;

	@ApiProperty()
	lastName!: string;

	@ApiProperty()
	id!: string;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;

	@ApiProperty()
	roles!: Role[];

	@ApiProperty()
	permissions!: string[];

	@ApiProperty()
	schoolId!: string;
}
