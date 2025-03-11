import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { Material } from './materials.entity';

@Injectable()
export class MaterialsRepo extends BaseRepo<Material> {
	get entityName(): EntityName<Material> {
		return Material;
	}
}
