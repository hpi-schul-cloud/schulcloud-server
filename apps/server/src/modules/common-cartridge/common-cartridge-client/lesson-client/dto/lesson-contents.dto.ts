export class LessonContentDto {
	content: object;

	title: string;

	component: LessonContentDtoComponent;

	hidden: boolean;

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
	NE_XBOARD: 'neXboard',
} as const;

export type LessonContentDtoComponent =
	typeof LessonContentDtoComponentValues[keyof typeof LessonContentDtoComponentValues];
