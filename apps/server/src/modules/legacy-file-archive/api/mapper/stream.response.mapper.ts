import { StreamableFile } from '@nestjs/common';
import { GetFileResponse } from '../../domain';

export class StreamableFileMapper {
	public static fromResponse(fileResponse: GetFileResponse): StreamableFile {
		let disposition: string;

		if (fileResponse.contentType === 'application/pdf') {
			disposition = `inline;`;
		} else {
			disposition = `attachment;`;
		}

		const encodedFileName = encodeURIComponent(fileResponse.name);

		const streamableFile = new StreamableFile(fileResponse.data, {
			type: fileResponse.contentType,
			disposition: `${disposition}; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
			length: fileResponse.contentLength,
		});

		return streamableFile;
	}
}
