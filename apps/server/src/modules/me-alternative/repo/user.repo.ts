import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolEntity, User as UserEntity } from '@shared/domain/entity';
import { UserMapper } from './mapper/user.mapper';
import { User } from '../domain/user';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	public async getUserById(userId: string): Promise<User> {
		const userEntity = await this.em.findOneOrFail(UserEntity, { id: userId }, { populate: ['roles.roles', 'school'] });

		const user = UserMapper.mapToDomain(userEntity);

		return user;
	}
}
