import { Team, TeamUser } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { TeamDto, TeamUserDto } from '../services/dto/team.dto';

@Injectable()
export class TeamMapper {
	/**
	 * Maps a Team Entity to the ServiceDTO
	 * @param teamEntity The Entity
	 * @return The Dto
	 */
	public mapEntityToDto(teamEntity: Team): TeamDto {
		const teamUsers: TeamUserDto[] = teamEntity.teamUsers.map(
			(teamUser: TeamUser) =>
				new TeamUserDto({
					userId: teamUser.user.id,
					roleId: teamUser.role.id,
					schoolId: teamUser.school.id,
				})
		);
		return new TeamDto({ id: teamEntity.id, name: teamEntity.name, teamUsers });
	}
}
