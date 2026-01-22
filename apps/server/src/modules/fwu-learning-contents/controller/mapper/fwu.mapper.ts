import { FwuItem } from '../../interface/fwu-item';
import { FwuItemResponse } from '../dto/fwu-item.response';
import { FwuListResponse } from '../dto/fwu-list.response';

export class FwuMapper {
	public static mapToFwuItemResponse(item: FwuItem): FwuItemResponse {
		return new FwuItemResponse({
			id: item.id,
			title: item.title,
			targetUrl: item.targetUrl,
			thumbnailUrl: item.thumbnailUrl,
			description: item.description,
		});
	}

	public static mapToFwuListResponse(items: FwuItem[]): FwuListResponse {
		const data = items.map((item) => this.mapToFwuItemResponse(item));
		return new FwuListResponse(data);
	}
}
