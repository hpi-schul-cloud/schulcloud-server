import { Team } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { TeamDto, TeamUserDto } from '../services/dto/team.dto';

@Injectable()
export class TeamMapper {
	public mapEntityToDto(teamEntity: Team): TeamDto {
		const userIdDto: TeamUserDto[] = teamEntity.userIds.map(
			(teamUser) =>
				new TeamUserDto({
					userId: teamUser.userId._id.toString(),
					role: teamUser.role._id.toString(),
					schoolId: teamUser.schoolId._id.toString(),
				})
		);
		return new TeamDto({ id: teamEntity._id.toString(), name: teamEntity.name, userIds: userIdDto });
	}
}
