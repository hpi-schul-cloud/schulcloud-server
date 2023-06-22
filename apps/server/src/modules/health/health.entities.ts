import { AnyEntity } from '@mikro-orm/core';
import { EntityName } from '@mikro-orm/nestjs/typings';

import { HealthcheckEntity } from './repo/entity';

export const HealthEntities: EntityName<AnyEntity>[] = [HealthcheckEntity];
