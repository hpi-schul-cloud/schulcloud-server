import { LessonMetaDataDto } from './lesson-meta-data.dto';

export class LessonMetaDataListDto {
	data: Array<LessonMetaDataDto>;

	total: number;

	skip: number;

	limit: number;

	constructor(props: LessonMetaDataListDto) {
		this.data = props.data;
		this.total = props.total;
		this.skip = props.skip;
		this.limit = props.limit;
	}
}
