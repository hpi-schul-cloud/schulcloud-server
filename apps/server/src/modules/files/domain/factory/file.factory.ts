import { FileDo, FileProps } from '../do';
import { LegacyFileResponseVo } from '../vo';

export class FileFactory {
	public static create(props: FileProps): FileDo {
		return new FileDo(props);
	}

	public static buildFromLegacyFileResponse(response: LegacyFileResponseVo): FileDo {
		return FileFactory.create({
			id: response._id,
			name: response.name,
			isDirectory: response.isDirectory,
			parentId: response.parent,
			storageFileName: response.storageFileName,
			bucket: response.bucket,
			storageProviderId: response.storageProviderId,
		});
	}
}
