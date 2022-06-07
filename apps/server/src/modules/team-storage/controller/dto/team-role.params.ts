import { ApiProperty } from '@nestjs/swagger';
import { Role, Team } from '@shared/domain';
import { IsMongoId } from 'class-validator';

export class TeamRoleDto {
	@IsMongoId()
	@ApiProperty()
	team!: Team;

	@IsMongoId()
	@ApiProperty()
	role!: Role;
}
