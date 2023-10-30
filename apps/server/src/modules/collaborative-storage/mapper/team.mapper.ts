import { Injectable } from '@nestjs/common';
import { TeamEntity, TeamUserEntity } from '@shared/domain/entity/team.entity';
import { TeamDto, TeamUserDto } from '../services/dto/team.dto';

@Injectable()
export class TeamMapper {
	/**
	 * Maps a Team Entity to the ServiceDTO
	 * @param teamEntity The Entity
	 * @return The Dto
	 */
	public mapEntityToDto(teamEntity: TeamEntity): TeamDto {
		const teamUsers: TeamUserDto[] = teamEntity.teamUsers.map(
			(teamUser: TeamUserEntity) =>
				new TeamUserDto({
					userId: teamUser.user.id,
					roleId: teamUser.role.id,
					schoolId: teamUser.school.id,
				})
		);
		return new TeamDto({ id: teamEntity.id, name: teamEntity.name, teamUsers });
	}
}
