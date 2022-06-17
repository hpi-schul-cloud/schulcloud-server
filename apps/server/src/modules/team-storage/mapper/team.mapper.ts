import { Team } from '@shared/domain';
import { TeamDto, TeamUserDto } from '../services/dto/team.dto';
import {Injectable} from "@nestjs/common";

@Injectable()
export class TeamMapper {
	public mapEntityToDto(teamEntity: Team): TeamDto {
		let userIdDto: TeamUserDto[] = teamEntity.userIds.map(teamUser =>
			new TeamUserDto({userId: teamUser.userId._id.toString(),role: teamUser.role._id.toString(),schoolId: teamUser.schoolId._id.toString()}));
		return new TeamDto({ id: teamEntity._id.toString(), name: teamEntity.name, userIds: userIdDto });
	}

}
