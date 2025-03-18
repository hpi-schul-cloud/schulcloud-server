import { EntityData } from '@mikro-orm/core';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { User } from '../../repo/user.entity';
import { UserDo } from '../do/user.do';
import { UserQuery } from '../query/user-query';

export interface UserDoRepo {
	find(query: UserQuery, options?: IFindOptions<UserDo>): Promise<Page<UserDo>>;

	findById(id: EntityId, populate: boolean): Promise<UserDo>;
	findById(id: EntityId): Promise<UserDo>;

	findByIds(ids: string[], populate: boolean): Promise<UserDo[]>;
	findByIds(ids: string[]): Promise<UserDo[]>;

	findByIdOrNull(id: EntityId, populate: boolean): Promise<UserDo | null>;
	findByIdOrNull(id: EntityId): Promise<UserDo | null>;

	findByExternalIdOrFail(externalId: string, systemId: string): Promise<UserDo>;

	findByExternalId(externalId: string, systemId: string): Promise<UserDo | null>;

	findByEmail(email: string): Promise<UserDo[]>;

	mapEntityToDO(entity: User): UserDo;

	mapDOToEntityProperties(entityDO: UserDo): EntityData<User>;

	findByTspUids(tspUids: string[]): Promise<UserDo[]>;

	save(domainObject: UserDo): Promise<UserDo>;

	saveAll(domainObjects: UserDo[]): Promise<UserDo[]>;
}

export const USER_DO_REPO = Symbol('USER_DO_REPO');
