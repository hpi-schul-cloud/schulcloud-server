import { User as UserEntity } from '@shared/domain/entity';
import { User } from '../../domain/user';

export class UserMapper {
	public static mapToDo(entity: UserEntity): User {
		const user = new User({
			id: entity.id,
			firstName: entity.firstName,
			lastName: entity.lastName,
			email: entity.email,
			classes: [],
		});

		return user;
	}

	public static mapToDos(entities: UserEntity[]): User[] {
		const users = entities.map((user) => UserMapper.mapToDo(user));

		return users;
	}
}
