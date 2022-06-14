import { System } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

export class SystemMapper {
	static mapFromEntityToDto(entity: System): SystemDto {
		return new SystemDto({
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			oauthConfig: entity.oauthConfig
		});
	}

	static mapFromEntitiesToDtos(enities: System[]): SystemDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}
}
