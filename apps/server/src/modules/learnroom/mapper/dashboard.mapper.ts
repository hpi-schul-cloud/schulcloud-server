import { DashboardEntity } from '@shared/domain';
import { DashboardResponse, DashboardGridElementResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse();

		dto.id = dashboard.id;

		dto.gridElements = dashboard.getGrid().map((elementWithPosition) => {
			const elementDTO = new DashboardGridElementResponse();

			elementDTO.id = elementWithPosition.gridElement.getId();
			const data = elementWithPosition.gridElement.getContent();
			elementDTO.title = data.title;
			elementDTO.shortTitle = data.shortTitle;
			elementDTO.displayColor = data.displayColor;
			if (data.group) {
				elementDTO.groupElements = data.group;
			}

			const { pos } = elementWithPosition;
			elementDTO.xPosition = pos.x;
			elementDTO.yPosition = pos.y;

			return elementDTO;
		});

		return dto;
	}
}
