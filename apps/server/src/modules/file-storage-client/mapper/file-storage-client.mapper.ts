import { FileRecordParentType } from '@shared/domain';
import { AxiosResponse } from 'axios';
import { FileDto } from '../dto';

export class FileStorageClientMapper {
	static mapAxiosToDomain(axiosResponse: AxiosResponse): FileDto {
		const fileDto = new FileDto({
			id: '123',
			name: '123',
			parentType: FileRecordParentType.User,
			parentId: '123',
			schoolId: '123',
		});

		return fileDto;
	}
}
