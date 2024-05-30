import { ClassEntity } from '@src/modules/class/entity';
import { Class } from '../../domain/class';

export class ClassMapper {
	public static mapToDo(entity: ClassEntity): Class {
		const userIds = entity.userIds?.map((_id) => _id.toString()) ?? [];
		const teacherIds = entity.teacherIds?.map((_id) => _id.toString()) ?? [];

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
