import { Injectable } from '@nestjs/common';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamPermissionsDto } from '../services/dto/team-permissions.dto';

@Injectable()
export class TeamPermissionsMapper {
	/**
	 * Maps a TeamPermissions Body to a ServiceDTO
	 * @param body The TeamPermissions Body
	 * @return The mapped DTO
	 */
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
