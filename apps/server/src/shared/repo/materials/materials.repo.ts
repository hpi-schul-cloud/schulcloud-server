import { Injectable } from '@nestjs/common';
import { Material } from '@shared/domain/entity/materials.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class MaterialsRepo extends BaseRepo<Material> {
	get entityName() {
		return Material;
	}
}
