import { FileDo, FileProps } from '../do';

export interface LegacyFileResponse {
	_id: string;
	name: string;
	isDirectory: boolean;
	parent?: string;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: string;
}

export class FileFactory {
	public static build(props: FileProps): FileDo {
		return new FileDo(props);
	}

	public static buildFromLegacyFileResponse(response: LegacyFileResponse): FileDo {
		return FileFactory.build({
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
