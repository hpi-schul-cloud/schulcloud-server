import { ApiProperty } from '@nestjs/swagger';
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

	@ApiProperty()
	content?:
		| ComponentTextProperties
		| ComponentEtherpadProperties
		| ComponentGeogebraProperties
		| ComponentInternalProperties
		| ComponentLernstoreProperties
		| ComponentNexboardProperties;

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
