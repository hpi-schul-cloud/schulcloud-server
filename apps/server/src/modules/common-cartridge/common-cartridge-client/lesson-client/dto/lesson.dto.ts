import { LessonContentDto } from './lesson-contents.dto';
import { LessonMaterialsDto } from './lesson-materials.dto';

export class LessonDto {
	_id: string;

	lessonId: string;

	name: string;

	courseId?: string;

	courseGroupId?: string;

	hidden: boolean;

	position: number;

	contents: LessonContentDto[];

	materials: LessonMaterialsDto[];

	constructor(props: LessonDto) {
		this._id = props._id;
		this.lessonId = props.lessonId;
		this.name = props.name;
		this.courseId = props.courseId;
		this.courseGroupId = props.courseGroupId;
		this.hidden = props.hidden;
		this.position = props.position;
		this.contents = props.contents;
		this.materials = props.materials;
	}
}
