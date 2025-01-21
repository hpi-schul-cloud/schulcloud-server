import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User as UserEntity } from '@shared/domain/entity';
import { User } from '../domain/user';
import { UserMapper } from './mapper/user.mapper';
import { UserRepo } from '../uc/interface/user.repo.interface';

@Injectable()
export class UserMikroOrmRepo implements UserRepo {
	constructor(private readonly em: EntityManager) {}

	public async getUserById(userId: string): Promise<User> {
		const userEntity = await this.em.findOneOrFail(UserEntity, { id: userId }, { populate: ['roles.roles', 'school'] });

		const user = UserMapper.mapToDomain(userEntity);

		return user;
	}
}
