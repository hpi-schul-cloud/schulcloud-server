import { User } from '../../domain/user';
import { MeDto } from '../dto/me.dto';

export class MeMapper {
	public static mapToDto(user: User): MeDto {
		const { id, firstName, schoolName } = user.getProps();
		const permissions = user.resolvePermissions();

		const dto = new MeDto(id, firstName, schoolName, permissions);

		return dto;
	}
}
