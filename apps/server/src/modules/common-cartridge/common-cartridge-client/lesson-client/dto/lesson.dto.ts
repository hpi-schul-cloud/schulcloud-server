import { LessonContentDto } from './lesson-contents.dto';
import { LessonLinkedTaskDto } from './lesson-linked-task.dto';
import { LessonMaterialsDto } from './lesson-materials.dto';

export class LessonDto {
	public lessonId: string;

	public name: string;

	public courseId?: string;

	public courseGroupId?: string;

	public hidden: boolean;

	public position: number;

	public contents: LessonContentDto[];

	public materials: LessonMaterialsDto[];

	public linkedTasks: LessonLinkedTaskDto[];

	constructor(props: LessonDto) {
		this.lessonId = props.lessonId;
		this.name = props.name;
		this.courseId = props.courseId;
		this.courseGroupId = props.courseGroupId;
		this.hidden = props.hidden;
		this.position = props.position;
		this.contents = props.contents;
		this.materials = props.materials;
		this.linkedTasks = props.linkedTasks;
	}
}
