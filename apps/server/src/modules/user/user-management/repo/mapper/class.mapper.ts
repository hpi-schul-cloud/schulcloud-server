import { ClassEntity } from '@src/modules/class/entity';
import { Class } from '../../domain/class';

export class ClassMapper {
	public static mapToDo(entity: ClassEntity): Class {
		// @ts-ignore Needed because of wrong reference types in ClassEntity
		const userIds = entity.userIds?.map((user) => user._id.toString()) ?? [];

		const c = new Class({
			id: entity.id,
			name: entity.name,
			// @ts-ignore Needed because of wrong reference types in ClassEntity
			userIds,
		});

		return c;
	}

	public static mapToDos(entities: ClassEntity[]): Class[] {
		const classes = entities.map((c) => ClassMapper.mapToDo(c));

		return classes;
	}
}
