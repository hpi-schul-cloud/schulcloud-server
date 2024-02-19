import { Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { CourseGroup } from '@shared/domain/entity';
import { DeletionService, DomainOperation } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { CourseGroupRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class CourseGroupService implements DeletionService {
	constructor(private readonly repo: CourseGroupRepo, private readonly logger: Logger) {
		this.logger.setContext(CourseGroupService.name);
	}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserData(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from CourseGroup',
				DomainName.COURSEGROUP,
				userId,
				StatusModel.PENDING
			)
		);
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		courseGroups.forEach((courseGroup) => courseGroup.removeStudent(userId));

		await this.repo.save(courseGroups);

		const result = DomainOperationBuilder.build(
			DomainName.COURSEGROUP,
			OperationType.UPDATE,
			count,
			this.getCourseGroupsId(courseGroups)
		);

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

	private getCourseGroupsId(courseGroups: CourseGroup[]): EntityId[] {
		return courseGroups.map((courseGroup) => courseGroup.id);
	}
}
