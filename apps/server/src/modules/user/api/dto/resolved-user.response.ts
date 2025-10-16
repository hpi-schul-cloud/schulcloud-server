import { ApiProperty } from '@nestjs/swagger';

export type Role = {
	name: string;

	id: string;
};

export class ResolvedUserResponse {
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
