import { LessonContentResponseContentInnerDto } from './lesson-content-response-inner.dto';

export class LessonContentDto {
	public id: string | undefined;

	public content: LessonContentResponseContentInnerDto;

	public title: string;

	public component: LessonContentDtoComponent;

	public hidden: boolean;

	constructor(props: LessonContentDto) {
		this.content = props.content;
		this.title = props.title;
		this.component = props.component;
		this.hidden = props.hidden;
	}
}

export const LessonContentDtoComponentValues = {
	ETHERPAD: 'Etherpad',
	GEO_GEBRA: 'geoGebra',
	INTERNAL: 'internal',
	RESOURCES: 'resources',
	TEXT: 'text',
} as const;

export type LessonContentDtoComponent =
	(typeof LessonContentDtoComponentValues)[keyof typeof LessonContentDtoComponentValues];
