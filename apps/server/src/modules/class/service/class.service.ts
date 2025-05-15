import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';
@Injectable()
export class ClassService {
	constructor(private readonly classesRepo: ClassesRepo, private readonly logger: Logger) {
		this.logger.setContext(ClassService.name);
	}

	public async findClassesForSchool(schoolId: EntityId): Promise<Class[]> {
		const classes: Class[] = await this.classesRepo.findAllBySchoolId(schoolId);

		return classes;
	}

	public async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: Class[] = await this.classesRepo.findAllByUserId(userId);

		return classes;
	}

	public async findClassWithSchoolIdAndExternalId(schoolId: EntityId, externalId: string): Promise<Class | null> {
		const result: Class | null = await this.classesRepo.findClassWithSchoolIdAndExternalId(schoolId, externalId);

		return result;
	}

	public async save(classes: Class | Class[]): Promise<void> {
		await this.classesRepo.save(classes);
	}

	public async findById(id: EntityId): Promise<Class> {
		const clazz: Class | null = await this.classesRepo.findClassById(id);
		if (!clazz) {
			throw new NotFoundLoggableException(Class.name, { id });
		}
		return clazz;
	}
}
