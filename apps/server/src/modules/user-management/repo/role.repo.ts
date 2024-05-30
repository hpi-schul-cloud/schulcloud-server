import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Role } from '@shared/domain/entity';
import { RoleRepo } from '../uc/interface/role.repo.interface';

@Injectable()
export class RoleMikroOrmRepo implements RoleRepo {
	constructor(private readonly em: EntityManager) {}

	public async getNameForId(id: string): Promise<string> {
		const role = await this.em.findOneOrFail(Role, { id });

		return role.name;
	}
}
