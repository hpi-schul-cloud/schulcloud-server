import { Team } from '@shared/domain';
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
		const userIdDto: TeamUserDto[] = teamEntity.userIds.map(
			(teamUser) =>
				new TeamUserDto({
					userId: teamUser.userId.id,
					roleId: teamUser.role.id,
					schoolId: teamUser.schoolId.id,
				})
		);
		return new TeamDto({ id: teamEntity.id, name: teamEntity.name, teamUsers: userIdDto });
	}
}
