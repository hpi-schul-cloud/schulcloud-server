import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DomainModel, EntityId, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
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

	public async deleteUserDataFromClasses(userId: EntityId): Promise<number> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Classes',
				DomainModel.CLASS,
				userId,
				StatusModel.PENDING
			)
		);

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

		const numberOfUpdatedClasses = updatedClasses.length;

		await this.classesRepo.updateMany(updatedClasses);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Classes',
				DomainModel.CLASS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedClasses,
				0
			)
		);

		return numberOfUpdatedClasses;
	}
}
