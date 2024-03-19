import { DashboardEntity, GridElementContent, GridElementWithPosition, GridPosition } from '@shared/domain/entity';
import { LearnroomMetadata } from '@shared/domain/types';
import { DashboardGridElementResponse, DashboardGridSubElementResponse, DashboardResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse({
			id: dashboard.getId(),
			gridElements: dashboard
				.getGrid()
				.map((elementWithPosition) => DashboardMapper.mapGridElement(elementWithPosition)),
		});
		return dto;
	}

	private static mapGridElement(data: GridElementWithPosition): DashboardGridElementResponse {
		const elementData: GridElementContent = data.gridElement.getContent();
		const position: GridPosition = data.pos;
		const dto: DashboardGridElementResponse = new DashboardGridElementResponse({
			title: elementData.title,
			shortTitle: elementData.shortTitle,
			displayColor: elementData.displayColor,
			xPosition: position.x,
			yPosition: position.y,
			copyingSince: elementData.copyingSince ?? undefined,
			isSynchronized: elementData.isSynchronized,
		});
		if (elementData.referencedId) {
			dto.id = elementData.referencedId;
		}
		if (elementData.group && elementData.groupId) {
			dto.groupId = elementData.groupId;
			dto.groupElements = elementData.group.map((groupMetadata) => DashboardMapper.mapLearnroom(groupMetadata));
		}
		return dto;
	}

	private static mapLearnroom(metadata: LearnroomMetadata): DashboardGridSubElementResponse {
		return new DashboardGridSubElementResponse(metadata);
	}
}
