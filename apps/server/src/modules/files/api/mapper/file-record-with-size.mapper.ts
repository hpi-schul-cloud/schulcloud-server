import type { FileDo } from '../../domain';
import { FileRecordWithSizeResponse } from '../dto/file-record-with-size.response';

export class FileRecordWithSizeMapper {
	public static mapFileDo(fileDo: FileDo): FileRecordWithSizeResponse {
		return new FileRecordWithSizeResponse({
			id: fileDo.id,
			name: fileDo.name,
			isDirectory: fileDo.isDirectory,
			parentId: fileDo.parentId,
			size: fileDo.size,
		});
	}
}
