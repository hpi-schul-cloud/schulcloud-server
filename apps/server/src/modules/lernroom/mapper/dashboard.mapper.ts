import { DashboardEntity } from '../../../entities/learnroom/dashboard.entity';
import { DashboardResponse, DashboardGridElementResponse } from '../controller/dto';

export class DashboardMapper {
	static mapToResponse(dashboard: DashboardEntity): DashboardResponse {
		const dto = new DashboardResponse();

		dto.id = dashboard.id;

		dto.gridElements = dashboard.getGrid().map((gridElement) => {
			const elementDTO = new DashboardGridElementResponse();

			const data = gridElement.getMetadata();
			elementDTO.id = data.id;
			elementDTO.title = data.title;
			elementDTO.shortTitle = data.shortTitle;
			elementDTO.displayColor = data.displayColor;

			const pos = gridElement.getPosition();
			elementDTO.xPosition = pos.x;
			elementDTO.yPosition = pos.y;

			return elementDTO;
		});

		return dto;
	}
}
