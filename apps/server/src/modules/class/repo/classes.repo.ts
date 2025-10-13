import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassEntity } from '../entity';
import { ClassScope } from './class.scope';
import { ClassMapper } from './mapper';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager) {}

	public async find(scope: ClassScope): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, scope.query);

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	public async findAllBySchoolId(schoolId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { schoolId: new ObjectId(schoolId) });

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	public async findClassWithSchoolIdAndExternalId(schoolId: EntityId, externalId: string): Promise<Class | null> {
		const result = await this.em.findOne(ClassEntity, {
			schoolId: new ObjectId(schoolId),
			sourceOptions: { tspUid: externalId },
		});
		const mapped = result ? ClassMapper.mapToDO(result) : null;

		return mapped;
	}

	public async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, {
			$or: [{ userIds: new ObjectId(userId) }, { teacherIds: new ObjectId(userId) }],
		});

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	public async save(classes: Class | Class[]): Promise<void> {
		const entities: ClassEntity[] = Array.isArray(classes)
			? classes.map((aclass: Class): ClassEntity => ClassMapper.mapToEntity(aclass))
			: [ClassMapper.mapToEntity(classes)];

		await this.em.upsertMany(entities);
		await this.em.flush();
	}

	public async findClassById(id: EntityId): Promise<Class | null> {
		const clazz = await this.em.findOne(ClassEntity, { id });

		if (!clazz) {
			return null;
		}

		const domainObject: Class = ClassMapper.mapToDO(clazz);

		return domainObject;
	}

	public async removeUserReference(userId: EntityId, classIds?: EntityId[]): Promise<number> {
		const userObjectId = new ObjectId(userId);
		const query: Record<string, any> = { $or: [{ userIds: userObjectId }, { teacherIds: userObjectId }] };
		if (classIds && classIds.length > 0) {
			query._id = { $in: classIds.map((id) => new ObjectId(id)) };
		}
		const count = await this.em.nativeUpdate(ClassEntity, query, {
			$pull: { userIds: userObjectId, teacherIds: userObjectId },
		} as Partial<ClassEntity>);

		return count;
	}
}
