import { IMaterialProperties, Material } from '@shared/domain/entity/materials.entity';
import { BaseFactory } from './base.factory';

class MaterialFactory extends BaseFactory<Material, IMaterialProperties> {}

export const materialFactory = MaterialFactory.define<Material, IMaterialProperties>(Material, ({ sequence }) => {
	return {
		client: 'test material client',
		description: 'test material description',
		license: [],
		merlinReference: '',
		relatedResources: [],
		subjects: [],
		tags: [],
		targetGroups: [],
		title: `material #${sequence}`,
		url: 'test material url',
	};
});
