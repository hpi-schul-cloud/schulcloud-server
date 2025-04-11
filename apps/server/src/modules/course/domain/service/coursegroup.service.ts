import { Logger } from '@core/logger';
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
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseGroupEntity, CourseGroupRepo } from '../../repo';

@Injectable()
export class CourseGroupService implements DeletionService {
	constructor(
		private readonly repo: CourseGroupRepo,
		private readonly logger: Logger,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(CourseGroupService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
	}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroupEntity[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from CourseGroup',
				DomainName.COURSEGROUP,
				userId,
				StatusModel.PENDING
			)
		);
		const [courseGroups] = await this.repo.findByUserId(userId);

		const count = await this.repo.removeUserReference(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.COURSEGROUP, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, count, this.getCourseGroupsId(courseGroups)),
		]);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from CourseGroup',
				DomainName.COURSEGROUP,
				userId,
				StatusModel.FINISHED,
				count,
				0
			)
		);

		return result;
	}

	private getCourseGroupsId(courseGroups: CourseGroupEntity[]): EntityId[] {
		return courseGroups.map((courseGroup) => courseGroup.id);
	}
}
