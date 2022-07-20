import { IMaterialProperties, Material } from '@shared/domain/entity/materials.entity';
import { BaseFactory } from './base.factory';

class MaterialFactory extends BaseFactory<Material, IMaterialProperties> {}

export const materialFactory = MaterialFactory.define<Material, IMaterialProperties>(Material, ({ sequence }) => {
	return {
		title: `material #${sequence}`,
		client: 'test material client',
		url: 'test material url',
		description: 'test material description',
		relatedResources: [],
		tags: [],
		targetGroups: [],
		subjects: [],
		license: [],
	};
});
