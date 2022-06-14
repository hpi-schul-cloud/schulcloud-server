import { Team } from '@shared/domain';
import { TeamDto, TeamUserDto } from '../services/dto/team.dto';
import {Injectable} from "@nestjs/common";

@Injectable()
export class TeamMapper {
	public mapEntityToDto(teamEntity: Team): TeamDto {
		let userIdDto: TeamUserDto[] = teamEntity.userIds.map(teamUser =>
			new TeamUserDto({userId: teamUser.userId.id,role: teamUser.role.id,schoolId: teamUser.schoolId.id}));
		return new TeamDto({ id: teamEntity.id, name: teamEntity.name, userIds: userIdDto });
	}

}
