import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class AppointmentFinderElementContent {
	constructor({ appointmentFinderId, adminId }: AppointmentFinderElementContent) {
		this.appointmentFinderId = appointmentFinderId;
		this.adminId = adminId;
	}

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	appointmentFinderId?: string;

	@ApiPropertyOptional()
	@DecodeHtmlEntities()
	adminId?: string;
}

export class AppointmentFinderElementResponse {
	constructor(props: AppointmentFinderElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.timestamps = props.timestamps;
		this.content = props.content;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.APPOINTMENT_FINDER;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	content: AppointmentFinderElementContent;
}
