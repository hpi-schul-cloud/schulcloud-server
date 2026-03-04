import { FileDo } from '../../domain/do/file';
import { FileEntity } from '../../entity/file.entity';

export class FileEntityMapper {
	public static mapToDo(entity: FileEntity): FileDo {
		return new FileDo({
			id: entity.id,
			name: entity.name,
			isDirectory: entity.isDirectory,
			parentId: entity.parentId,
			storageFileName: entity.storageFileName,
			bucket: entity.bucket,
			storageProviderId: entity.storageProvider?.id,
		});
	}

	public static mapToDos(entities: FileEntity[]): FileDo[] {
		return entities.map((entity) => FileEntityMapper.mapToDo(entity));
	}
}
