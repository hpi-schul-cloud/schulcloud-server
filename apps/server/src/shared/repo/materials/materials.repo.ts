import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Material } from '@shared/domain/entity/materials.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class MaterialsRepo extends BaseRepo<Material> {
	get entityName() {
		return Material;
	}

	async findById(id: EntityId): Promise<Material> {
		const material = await super.findById(id);
		return material;
	}
}
