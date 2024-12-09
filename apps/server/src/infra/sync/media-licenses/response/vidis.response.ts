import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { VidisItemResponse } from './vidis-item.response';

export class VidisResponse {
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => VidisItemResponse)
	items!: VidisItemResponse[];
}
