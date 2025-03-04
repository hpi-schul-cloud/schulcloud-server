import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	DataDeletionDomainOperationLoggable,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	StatusModel,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@core/logger';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';

@Injectable()
export class ClassUserDeleteService implements DeletionService {
	constructor(
		private readonly classesRepo: ClassesRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(ClassUserDeleteService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
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

	public async compensateDeletion(userId: EntityId): Promise<void> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Compensating deletion of user data from Classes',
				DomainName.CLASS,
				userId,
				StatusModel.PENDING
			)
		);
		return Promise.resolve();
	}

	private getClassesId(classes: Class[]): EntityId[] {
		return classes.map((item) => item.id);
	}
}
