import { BaseFactory } from '@testing/factory/base.factory';
import { Material, MaterialProperties } from '../repo';

class MaterialFactory extends BaseFactory<Material, MaterialProperties> {}

export const materialFactory = MaterialFactory.define<Material, MaterialProperties>(Material, ({ sequence }) => {
	return {
		client: 'test material client',
		description: 'test material description',
		license: [],
		relatedResources: [],
		subjects: [],
		tags: [],
		targetGroups: [],
		title: `material #${sequence}`,
		url: 'test material url',
	};
});
