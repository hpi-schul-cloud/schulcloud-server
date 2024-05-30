import { ClassEntity } from '@src/modules/class/entity';
import { Class } from '../../domain/class';

export class ClassMapper {
	public static mapToDo(entity: ClassEntity): Class {
		// TODO: Remove ts-ignore when reference types are fixed in ClassEntity.
		// @ts-ignore Needed because of wrong reference types in ClassEntity.
		const userIds = entity.userIds?.map((user) => user._id.toString()) ?? [];
		// @ts-ignore Needed because of wrong reference types in ClassEntity.
		const teacherIds = entity.teacherIds?.map((teacher) => teacher._id.toString()) ?? [];

		const c = new Class({
			id: entity.id,
			name: entity.name,
			studentIds: userIds,
			teacherIds,
		});

		return c;
	}

	public static mapToDos(entities: ClassEntity[]): Class[] {
		const classes = entities.map((c) => ClassMapper.mapToDo(c));

		return classes;
	}
}
