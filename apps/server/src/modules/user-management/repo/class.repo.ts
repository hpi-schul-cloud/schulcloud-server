import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ClassEntity } from '@src/modules/class/entity';
import { Class } from '../domain/class';
import { ClassRepo } from '../uc/interface/class.repo.interface';
import { ClassMapper } from './mapper/class.mapper';

@Injectable()
export class ClassMikroOrmRepo implements ClassRepo {
	constructor(private readonly em: EntityManager) {}

	public async getClassesForSchool(schoolId: string, sortOrder?: number): Promise<Class[]> {
		const entities = await this.em.find(
			ClassEntity,
			{ schoolId: new ObjectId(schoolId) },
			{ fields: ['name', 'userIds', 'teacherIds'], orderBy: { gradeLevel: sortOrder, name: sortOrder } }
		);

		const classes = ClassMapper.mapToDos(entities);

		return classes;
	}

	public async getClassesByIds(classIds: string[]): Promise<Class[]> {
		const entities = await this.em.find(ClassEntity, { id: classIds }, { fields: ['name', 'userIds', 'teacherIds'] });

		const classes = ClassMapper.mapToDos(entities);

		return classes;
	}
}
