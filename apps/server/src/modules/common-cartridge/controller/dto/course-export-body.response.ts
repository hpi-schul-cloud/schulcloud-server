import { CourseCommonCartridgeMetadataResponse } from '@infra/courses-client';
import { CourseFileIdsResponse } from './common-cartridge.response';

export class CourseExportBodyResponse {
	public courseFileIds?: CourseFileIdsResponse;

	public courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataResponse;

	constructor(courseExportBodyResponse: Readonly<CourseExportBodyResponse>) {
		this.courseFileIds = courseExportBodyResponse.courseFileIds;
		this.courseCommonCartridgeMetadata = courseExportBodyResponse.courseCommonCartridgeMetadata;
	}
}
