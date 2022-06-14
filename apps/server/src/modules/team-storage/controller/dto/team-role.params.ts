import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TeamRoleDto {
	@IsMongoId()
	@ApiProperty()
	team!: string;

	@IsMongoId()
	@ApiProperty()
	role!: string;
}
