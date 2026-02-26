import { GetFile } from '@infra/s3-client';
import archiver from 'archiver';
import { GetFileResponse } from '../interface';

export class FileResponseFactory {
	public static create(file: GetFile, name: string): GetFileResponse {
		const fileResponse = { ...file, data: file.data, name };

		return fileResponse;
	}

	public static createFromArchive(
		archiveName: string,
		archive: archiver.Archiver,
		archiveType: archiver.Format = 'zip'
	): GetFileResponse {
		const file: GetFile = {
			data: archive,
			contentType: `application/${archiveType}`,
		};
		const name = `${archiveName}.${archiveType}`;
		const fileResponse = this.create(file, name);

		return fileResponse;
	}
}
