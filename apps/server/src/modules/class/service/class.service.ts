import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class ClassService {
	constructor(private readonly classesRepo: ClassesRepo, private readonly logger: LegacyLogger) {
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

	public async deleteUserDataFromClasses(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Deleting data from Classes for user ', userId });

		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const domainObjects = await this.classesRepo.findAllByUserId(userId);

		const updatedClasses: Class[] = domainObjects.map((domainObject) => {
			if (domainObject.userIds !== undefined) {
				domainObject.removeUser(userId);
			}
			return domainObject;
		});

		await this.classesRepo.updateMany(updatedClasses);
		this.logger.log({ action: 'Deleted data from Classes for user ', userId });

		return updatedClasses.length;
	}
}
