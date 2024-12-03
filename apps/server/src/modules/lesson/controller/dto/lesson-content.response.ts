import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentInternalProperties,
	ComponentLernstoreProperties,
	ComponentNexboardProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
} from '@shared/domain/entity/lesson.entity';

class ComponentTextPropsImpl implements ComponentTextProperties {
	@ApiProperty({ nullable: false })
	text!: string;
}

class ComponentEtherpadPropsImpl implements ComponentEtherpadProperties {
	@ApiProperty({ nullable: false, description: 'description of a Etherpad component' })
	description!: string;

	@ApiProperty({ nullable: false, description: 'title of a Etherpad component' })
	title!: string;

	@ApiProperty({ nullable: false, description: 'url of a Etherpad component' })
	url!: string;
}

class ComponentNexboardPropsImpl implements ComponentNexboardProperties {
	@ApiProperty({ nullable: false, description: 'board of a Nexboard component' })
	board!: string;

	@ApiProperty({ nullable: false, description: 'description of a Nexboard component' })
	description!: string;

	@ApiProperty({ nullable: false, description: 'title of a Nexboard component' })
	title!: string;

	@ApiProperty({ nullable: false, description: 'url of a Nexboard component' })
	url!: string;
}

class ComponentGeogebraPropsImpl implements ComponentGeogebraProperties {
	@ApiProperty({ nullable: false, description: 'materialId of a Geogebra component' })
	materialId!: string;
}

class ComponentInternalPropsImpl implements ComponentInternalProperties {
	@ApiProperty({ nullable: false, description: 'url of a Internal component' })
	url!: string;
}

class ComponentLernstorePropsImpl implements ComponentLernstoreProperties {
	@ApiProperty({ nullable: false, description: 'resources of a Lernstore component' })
	resources!: {
		client: string;
		description: string;
		merlinReference?: string;
		title: string;
		url: string;
	}[];
}
@ApiExtraModels(
	ComponentTextPropsImpl,
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentLernstorePropsImpl,
	ComponentNexboardPropsImpl
)
export class LessonContentResponse {
	constructor(lessonContent: ComponentProperties) {
		this.id = lessonContent._id;
		// @deprecated _id used in legacy client
		this._id = lessonContent._id;
		this.title = lessonContent.title;
		this.hidden = lessonContent.hidden;
		this.component = lessonContent.component;
		this.content = lessonContent.content;
	}

	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(ComponentTextPropsImpl) },
			{ $ref: getSchemaPath(ComponentEtherpadPropsImpl) },
			{ $ref: getSchemaPath(ComponentGeogebraPropsImpl) },
			{ $ref: getSchemaPath(ComponentInternalPropsImpl) },
			{ $ref: getSchemaPath(ComponentLernstorePropsImpl) },
			{ $ref: getSchemaPath(ComponentNexboardPropsImpl) },
		],
	})
	content?:
		| ComponentTextPropsImpl
		| ComponentEtherpadPropsImpl
		| ComponentGeogebraPropsImpl
		| ComponentInternalPropsImpl
		| ComponentLernstorePropsImpl
		| ComponentNexboardPropsImpl;

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: '[a-f0-9]{24}',
		deprecated: true,
	})
	_id?: EntityId;

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: '[a-f0-9]{24}',
	})
	id?: EntityId;

	@ApiProperty({
		description: 'Title of the Material entity',
	})
	title: string;

	@ApiProperty({ enum: ComponentType })
	component: ComponentType;

	@ApiProperty()
	hidden: boolean;
}
