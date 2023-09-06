// import { InputFormat, ITaskCreate, ITaskUpdate, RichText, TaskWithStatusVo } from '@shared/domain';
// import { TaskCreateParams, TaskResponse, TaskUpdateParams } from '../controller/dto';
// import { TaskStatusMapper } from './task-status.mapper';

import { FederalStateEntity } from '../../entity';
import { FederalStateResponse } from '../dto/federal-state.response';

export class FederalStateMapper {
	static mapToResponse(federalStateEntity: FederalStateEntity): FederalStateResponse {
		// const { task, status } = taskWithStatus;
		// const taskDesc = task.getParentData();
		// const statusDto = TaskStatusMapper.mapToResponse(status);

		const dto = new FederalStateResponse({
			id: federalStateEntity.id,
			name: federalStateEntity.name,
			abbreviation: federalStateEntity.abbreviation,
			logoUrl: federalStateEntity.logoUrl,
			createdAt: federalStateEntity.createdAt,
			updatedAt: federalStateEntity.updatedAt,
		});
		return dto;
	}
}
