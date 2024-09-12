import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { EntityId } from '@shared/domain/types';

export class PreferredToolInfo {
	@ApiProperty()
	icon: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	schoolExternalToolId?: EntityId;

	constructor(props: PreferredToolInfo) {
		this.icon = props.icon;
		this.name = props.name;
		this.schoolExternalToolId = props.schoolExternalToolId;
	}
}

export class PreferredToolInfoList extends PaginationResponse<PreferredToolInfo[]> {
	constructor(data: PreferredToolInfo[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [PreferredToolInfo] })
	data: PreferredToolInfo[];
}
