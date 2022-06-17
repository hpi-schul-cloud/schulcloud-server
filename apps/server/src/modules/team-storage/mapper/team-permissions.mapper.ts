import { Injectable } from '@nestjs/common';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamPermissionsDto } from '../services/dto/team-permissions.dto';

@Injectable()
export class TeamPermissionsMapper {
	public mapBodyToDto(body: TeamPermissionsBody): TeamPermissionsDto {
		return new TeamPermissionsDto({
			create: body.create,
			delete: body.delete,
			read: body.read,
			share: body.share,
			write: body.write,
		});
	}
}
