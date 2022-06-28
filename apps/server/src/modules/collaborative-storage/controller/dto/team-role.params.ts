import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TeamRoleDto {
	@IsMongoId()
	@ApiProperty()
	teamId!: string;

	@IsMongoId()
	@ApiProperty()
	roleId!: string;
}
