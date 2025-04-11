import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { EntityId } from '@shared/domain/types';
import {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentInternalProperties,
	ComponentLernstoreProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
} from '../../repo';
import { LernstoreResources } from './lernstore.resources';

class ComponentTextPropsImpl implements ComponentTextProperties {
	@ApiProperty({ nullable: false })
	public text!: string;
}

class ComponentEtherpadPropsImpl implements ComponentEtherpadProperties {
	@ApiProperty({ nullable: false, description: 'description of a Etherpad component' })
	public description!: string;

	@ApiProperty({ nullable: false, description: 'title of a Etherpad component' })
	public title!: string;

	@ApiProperty({ nullable: false, description: 'url of a Etherpad component' })
	public url!: string;
}

class ComponentGeogebraPropsImpl implements ComponentGeogebraProperties {
	@ApiProperty({ nullable: false, description: 'materialId of a Geogebra component' })
	public materialId!: string;
}

class ComponentInternalPropsImpl implements ComponentInternalProperties {
	@ApiProperty({ nullable: false, description: 'url of a Internal component' })
	public url!: string;
}

class ComponentLernstorePropsImpl implements ComponentLernstoreProperties {
	@ApiProperty({ nullable: false, description: 'resources of a Lernstore component', type: [LernstoreResources] })
	public resources!: LernstoreResources[];
}
@ApiExtraModels(
	ComponentTextPropsImpl,
	ComponentEtherpadPropsImpl,
	ComponentGeogebraPropsImpl,
	ComponentInternalPropsImpl,
	ComponentLernstorePropsImpl
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
		],
	})
	public content?:
		| ComponentTextPropsImpl
		| ComponentEtherpadPropsImpl
		| ComponentGeogebraPropsImpl
		| ComponentInternalPropsImpl
		| ComponentLernstorePropsImpl;

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: bsonStringPattern,
		deprecated: true,
	})
	public _id?: EntityId;

	@ApiProperty({
		description: 'The id of the Material entity',
		pattern: bsonStringPattern,
	})
	public id?: EntityId;

	@ApiProperty({
		description: 'Title of the Material entity',
	})
	public title: string;

	@ApiProperty({ enum: ComponentType })
	public component: ComponentType;

	@ApiProperty()
	public hidden: boolean;
}
