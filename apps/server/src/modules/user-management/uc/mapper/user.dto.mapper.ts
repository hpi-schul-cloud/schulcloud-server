import { User } from '../../domain/user';
import { UserForUserListDto } from '../dto/user-for-user-list.dto';
import { ClassDtoMapper } from './class.dto.mapper';

export class UserDtoMapper {
	public static mapToDto(user: User): UserForUserListDto {
		const userProps = user.getProps();
		const classes = ClassDtoMapper.mapToDtos(userProps.classes);

		const dto = new UserForUserListDto({
			id: userProps.id,
			firstName: userProps.firstName,
			lastName: userProps.lastName,
			email: userProps.email,
			classes,
		});

		return dto;
	}

	public static mapToDtos(users: User[]): UserForUserListDto[] {
		const dtos = users.map((user) => UserDtoMapper.mapToDto(user));

		return dtos;
	}
}
