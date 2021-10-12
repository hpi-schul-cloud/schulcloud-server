import { DashboardEntity } from '@shared/domain';
import { DashboardResponse, DashboardGridElementResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse();

		dto.id = dashboard.id;

		dto.gridElements = dashboard.getGrid().map((elementWithPosition) => {
			const elementDTO = new DashboardGridElementResponse();

			const data = elementWithPosition.gridElement.getMetadata();
			elementDTO.id = data.id;
			elementDTO.title = data.title;
			elementDTO.shortTitle = data.shortTitle;
			elementDTO.displayColor = data.displayColor;

			const { pos } = elementWithPosition;
			elementDTO.xPosition = pos.x;
			elementDTO.yPosition = pos.y;

			return elementDTO;
		});

		return dto;
	}
}
