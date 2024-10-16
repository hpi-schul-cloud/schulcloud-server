export class LessonMaterialsDto {
	_id: string;

	materialsId: string;

	title: string;

	relatedResources: string[];

	url: string;

	client: string;

	license: string[];

	merlinReference: string;

	constructor(props: LessonMaterialsDto) {
		this._id = props._id;
		this.materialsId = props.materialsId;
		this.title = props.title;
		this.relatedResources = props.relatedResources;
		this.url = props.url;
		this.client = props.client;
		this.license = props.license;
		this.merlinReference = props.merlinReference;
	}
}
