import { DashboardEntity } from '@shared/domain';
import { DashboardResponse, DashboardGridElementResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const { id } = dashboard;

		const gridElements = dashboard.getGrid().map((elementWithPosition) => {
			const gridElementId = elementWithPosition.gridElement.getId();
			const { title, shortTitle, displayColor, group } = elementWithPosition.gridElement.getContent();

			const { x, y } = elementWithPosition.pos;

			const elementDTO = new DashboardGridElementResponse({
				id: gridElementId,
				title,
				shortTitle,
				displayColor,
				xPosition: x,
				yPosition: y,
				groupElements: group || [],
			});
			return elementDTO;
		});

		const dto = new DashboardResponse({ id, gridElements });

		return dto;
	}
}
