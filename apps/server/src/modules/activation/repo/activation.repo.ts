import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo';
import { EntityName } from '@mikro-orm/core';
import { ActivationEntity } from '../entity';

@Injectable()
export class ActivationRepo extends BaseRepo<ActivationEntity> {
	get entityName(): EntityName<ActivationEntity> {
		return ActivationEntity;
	}
}
