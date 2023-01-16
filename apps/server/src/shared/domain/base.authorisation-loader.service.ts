import { BaseDO } from './domainobject';
import { EntityId } from './types';

export abstract class AuthorisationLoaderService<BaseDO> {
	abstract getById(id: EntityId): BaseDO;
}
