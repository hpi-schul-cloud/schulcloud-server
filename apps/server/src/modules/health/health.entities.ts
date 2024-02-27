import { AnyEntity } from '@mikro-orm/core';
import { EntityName } from '@mikro-orm/nestjs/typings';

import { HealthCheckEntity } from './repo/entity';

export const HealthEntities: EntityName<AnyEntity>[] = [HealthCheckEntity];
