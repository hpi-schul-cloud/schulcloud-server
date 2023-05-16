import { BaseDO } from '@shared/domain/domainobject/base.do';
import { BoardDoAuthorizable } from '@shared/domain/domainobject/board/types/board-do-authorizable';
import { BaseEntity } from '@shared/domain/entity/base.entity';
import { BaseDomainObject } from '@shared/domain/interface/base-domain-object';

export type AuthorizableObject = BaseDomainObject | BaseEntity | BaseDO | BoardDoAuthorizable;
