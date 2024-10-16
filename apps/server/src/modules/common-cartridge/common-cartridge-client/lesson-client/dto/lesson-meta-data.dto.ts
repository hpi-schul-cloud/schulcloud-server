export class LessonMetaDataDto {
	_id: string;

	name: string;

	constructor(props: LessonMetaDataDto) {
		this._id = props._id;
		this.name = props.name;
	}
}
