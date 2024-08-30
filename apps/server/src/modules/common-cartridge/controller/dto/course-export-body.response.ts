import { CourseCommonCartridgeMetadataDto } from '../../common-cartridge-client/course-client';
import { CourseFileIdsResponse } from './common-cartridge.response';

export class CourseExportBodyResponse {
	courseFileIds?: CourseFileIdsResponse;

	courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto;

	constructor(courseExportBodyResponse: CourseExportBodyResponse) {
		this.courseFileIds = courseExportBodyResponse.courseFileIds;
		this.courseCommonCartridgeMetadata = courseExportBodyResponse.courseCommonCartridgeMetadata;
	}
}
