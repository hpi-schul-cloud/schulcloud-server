import { User } from '../../domain/user';
import { UserListDto } from '../dto/user-list.dto';
import { UserDtoMapper } from './user.dto.mapper';

export class UserListDtoMapper {
	public static mapToDto(users: User[], limit: number, offset: number, total: number): UserListDto {
		const data = UserDtoMapper.mapToDtos(users);

		const dto = new UserListDto({
			limit,
			offset,
			total,
			data,
		});

		return dto;
	}
}
