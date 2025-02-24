import { ICurrentUser } from '@infra/auth-guard';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { Injectable } from '@nestjs/common';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { DEFAULT_FILE_PARSER_OPTIONS } from '../import/common-cartridge-import.types';

@Injectable()
export class CommonCartridgeImportService {
	constructor(
		private readonly coursesClient: CoursesClientAdapter,
		private readonly fileStorageClient: FilesStorageClientAdapter
	) {}

	public async importManifestFile(file: Buffer, currentUser: ICurrentUser): Promise<void> {
		const parser = new CommonCartridgeFileParser(file, DEFAULT_FILE_PARSER_OPTIONS);

		await this.createCourse(parser, currentUser);
	}

	private async createCourse(parser: CommonCartridgeFileParser, currentUser: ICurrentUser): Promise<void> {
		const courseName = parser.getTitle() ?? 'Untitled Course';

		await this.coursesClient.createCourse({ title: courseName });
		await this.uploadCourseFiles(parser, currentUser);
	}

	private async uploadCourseFiles(parser: CommonCartridgeFileParser, currentUser: ICurrentUser): Promise<void> {
		const organizations = parser.getOrganizations();
		for await (const organization of organizations) {
			const commonCartridgeFileResourceProps = parser.getFilesResource(organization, currentUser);
			if (commonCartridgeFileResourceProps) {
				await this.fileStorageClient.upload(
					currentUser.schoolId,
					commonCartridgeFileResourceProps.storageLocation,
					commonCartridgeFileResourceProps.parentId,
					commonCartridgeFileResourceProps.parentType,
					new File([commonCartridgeFileResourceProps.file], organization.title)
				);
			}
		}
	}
}
