import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@core/logger';
import { Class } from '../domain';
import { ClassesRepo } from '../repo';
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
@Injectable()
export class ClassService implements DeletionService {
	constructor(
		private readonly classesRepo: ClassesRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(ClassService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
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

		const classes = await this.classesRepo.findAllByUserId(userId);
		const numberOfUpdatedClasses = await this.classesRepo.removeUserReference(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.CLASS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, numberOfUpdatedClasses, this.getClassesId(classes)),
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
