import { AppointmentFinderElement, ContentElementType } from '../../domain';
import { AppointmentFinderElementResponse, TimestampsResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';

export class AppointmentFinderElementResponseMapper implements BaseResponseMapper {
	private static instance: AppointmentFinderElementResponseMapper;

	public static getInstance(): AppointmentFinderElementResponseMapper {
		if (!AppointmentFinderElementResponseMapper.instance) {
			AppointmentFinderElementResponseMapper.instance = new AppointmentFinderElementResponseMapper();
		}

		return AppointmentFinderElementResponseMapper.instance;
	}

	mapToResponse(element: AppointmentFinderElement): AppointmentFinderElementResponse {
		const result = new AppointmentFinderElementResponse({
			id: element.id,
			timestamps: new TimestampsResponse({ lastUpdatedAt: element.updatedAt, createdAt: element.createdAt }),
			type: ContentElementType.APPOINTMENT_FINDER,
			content: {
				appointmentFinderId: element.appointmentFinderId,
				adminId: element.adminId,
			},
		});

		return result;
	}

	canMap(element: AppointmentFinderElement): boolean {
		return element instanceof AppointmentFinderElement;
	}
}
