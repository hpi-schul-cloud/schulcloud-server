import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { Material, RelatedResourceProperties } from '@shared/domain/entity';

export class MaterialResponse {
	constructor(material: Material) {
		this.id = material.id;
		this._id = material.id;
		this.client = material.client;
		this.license = material.license;
		this.relatedResources = material.relatedResources;
		this.title = material.title;
		this.url = material.url;
		this.merlinReference = material.merlinReference;
	}

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: '[a-f0-9]{24}',
	})
	_id: EntityId;

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: '[a-f0-9]{24}',
	})
	id: EntityId;

	@ApiProperty({
		description: 'Title of the Material entity',
	})
	title: string;

	@ApiProperty({
		description: '?',
	})
	relatedResources: RelatedResourceProperties[];

	@ApiProperty({
		description: 'Url of the material',
	})
	url?: string;

	@ApiProperty({
		description: 'Position of the Lesson entity',
	})
	client: string;

	@ApiProperty({
		description: 'Description of the material license',
	})
	license: string[];

	@ApiProperty({
		description: 'For material from Merlin, the Merlin reference',
	})
	merlinReference?: string;
}
