import { DashboardEntity, GridElementWithPosition, LearnroomMetadata } from '@shared/domain';
import { DashboardResponse, DashboardGridElementResponse, DashboardGridSubElementResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse({
			id: dashboard.getId(),
			gridElements: dashboard
				.getGrid()
				.map((elementWithPosition) => DashboardMapper.FromGridElementWithPosition(elementWithPosition)),
		});
		return dto;
	}

	private static FromGridElementWithPosition(data: GridElementWithPosition): DashboardGridElementResponse {
		const elementData = data.gridElement.getContent();
		const position = data.pos;
		const dto = new DashboardGridElementResponse({
			title: elementData.title,
			shortTitle: elementData.shortTitle,
			displayColor: elementData.displayColor,
			xPosition: position.x,
			yPosition: position.y,
		});
		if (elementData.referencedId) {
			dto.id = elementData.referencedId;
		}
		if (elementData.group && elementData.groupId) {
			dto.groupId = elementData.groupId;
			dto.groupElements = elementData.group.map((groupMetadata) =>
				DashboardMapper.FromLearnroomMetadata(groupMetadata)
			);
		}
		return dto;
	}

	private static FromLearnroomMetadata(metadata: LearnroomMetadata): DashboardGridSubElementResponse {
		return new DashboardGridSubElementResponse(metadata);
	}
}
