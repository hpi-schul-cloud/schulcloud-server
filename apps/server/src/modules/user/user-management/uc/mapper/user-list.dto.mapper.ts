import { User } from '../../domain/user';
import { UserListDto } from '../dto/user-list.dto';
import { UserListQuery } from '../query/user-list.query';
import { UserDtoMapper } from './user.dto.mapper';

export class UserListDtoMapper {
	public static mapToDto(users: User[], query: UserListQuery, total: number): UserListDto {
		const data = UserDtoMapper.mapToDtos(users);

		const dto = new UserListDto({
			limit: query.limit,
			offset: query.offset,
			total,
			data,
		});

		return dto;
	}
}
