import { CourseCommonCartridgeMetadataResponse } from '@infra/common-cartridge-clients';
import { CourseFileIdsResponse } from './common-cartridge.response';

export class CourseExportBodyResponse {
	public courseFileIds?: CourseFileIdsResponse;

	public courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataResponse;

	constructor(courseExportBodyResponse: Readonly<CourseExportBodyResponse>) {
		this.courseFileIds = courseExportBodyResponse.courseFileIds;
		this.courseCommonCartridgeMetadata = courseExportBodyResponse.courseCommonCartridgeMetadata;
	}
}
