import { BaseDO, BaseEntity } from '@shared/domain';
import { BaseDomainObject } from '@shared/domain/interface/base-domain-object';

export type AuthorizableObject = BaseDomainObject | BaseEntity | BaseDO;
