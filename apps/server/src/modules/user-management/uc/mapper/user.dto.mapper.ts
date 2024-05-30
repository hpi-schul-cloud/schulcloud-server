import { User } from '../../domain/user';
import { UserDto } from '../dto/user.dto';
import { ClassDtoMapper } from './class.dto.mapper';

export class UserDtoMapper {
	public static mapToDto(user: User): UserDto {
		const userProps = user.getProps();
		const classes = ClassDtoMapper.mapToDtos(userProps.classes);

		const dto = new UserDto({
			id: userProps.id,
			firstName: userProps.firstName,
			lastName: userProps.lastName,
			email: userProps.email,
			classes,
		});

		return dto;
	}

	public static mapToDtos(users: User[]): UserDto[] {
		const dtos = users.map((user) => UserDtoMapper.mapToDto(user));

		return dtos;
	}
}
