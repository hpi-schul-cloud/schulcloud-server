import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class ClassService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly classesRepo: ClassesRepo,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(ClassService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async findClassesForSchool(schoolId: EntityId, sortOrder?: number): Promise<Class[]> {
		const classes: Class[] = await this.classesRepo.findAllBySchoolId(schoolId, sortOrder);

		return classes;
	}

	public async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: Class[] = await this.classesRepo.findAllByUserId(userId);

		return classes;
	}

	public async getClassesByIds(classIds: string[], sortOrder?: number): Promise<Class[]> {
		const classes: Class[] = await this.classesRepo.getClassesByIds(classIds, sortOrder);

		return classes;
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
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

		const result = DomainDeletionReportBuilder.build(DomainName.CLASS, [
			DomainOperationReportBuilder.build(
				OperationType.UPDATE,
				numberOfUpdatedClasses,
				this.getClassesId(updatedClasses)
			),
		]);

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
