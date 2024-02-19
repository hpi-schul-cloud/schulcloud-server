import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainOperation, DeletionService } from '@shared/domain/interface';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class ClassService implements DeletionService {
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

	public async deleteUserData(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Classes',
				DomainName.CLASS,
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

		const result = DomainOperationBuilder.build(
			DomainName.CLASS,
			OperationType.UPDATE,
			numberOfUpdatedClasses,
			this.getClassesId(updatedClasses)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully removed user data from Classes',
				DomainName.CLASS,
				userId,
				StatusModel.FINISHED,
				numberOfUpdatedClasses,
				0
			)
		);

		return result;
	}

	private getClassesId(classes: Class[]): EntityId[] {
		return classes.map((item) => item.id);
	}
}
