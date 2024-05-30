import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ClassEntity } from '@src/modules/class/entity';
import { ClassMapper } from './mapper/class.mapper';

@Injectable()
export class ClassMikroOrmRepo {
	constructor(private readonly em: EntityManager) {}

	public async getClassesForSchool(schoolId: string, sortOrder?: number) {
		const entities = await this.em.find(
			ClassEntity,
			{ schoolId: new ObjectId(schoolId) },
			{ fields: ['name', 'userIds'], orderBy: { gradeLevel: sortOrder, name: 1 } }
		);

		const classes = ClassMapper.mapToDos(entities);

		return classes;
	}

	public async getClassesByIds(classIds: string[]) {
		const entities = await this.em.find(ClassEntity, { id: classIds }, { fields: ['name', 'userIds'] });

		const classes = ClassMapper.mapToDos(entities);

		return classes;
	}
}
