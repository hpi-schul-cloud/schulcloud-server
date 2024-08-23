import { CourseCommonCartridgeMetadataDto } from '../../common-cartridge-client/dto/course-common-cartridge-metadata.dto';
import { CourseFileIdsResponse } from './common-cartridge.response';

export class CourseExportBodyResponse {
	courseFileIds!: CourseFileIdsResponse;

	courseCommonCartridgeMetadata!: CourseCommonCartridgeMetadataDto;

	constructor(courseExportBodyResponse: CourseExportBodyResponse) {
		Object.assign(this, courseExportBodyResponse);
	}
}
