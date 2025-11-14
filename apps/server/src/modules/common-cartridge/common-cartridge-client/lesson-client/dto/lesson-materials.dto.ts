export class LessonMaterialsDto {
	materialsId: string;

	title: string;

	relatedResources: string[];

	url: string;

	client: string;

	license: string[];

	constructor(props: LessonMaterialsDto) {
		this.materialsId = props.materialsId;
		this.title = props.title;
		this.relatedResources = props.relatedResources;
		this.url = props.url;
		this.client = props.client;
		this.license = props.license;
	}
}
