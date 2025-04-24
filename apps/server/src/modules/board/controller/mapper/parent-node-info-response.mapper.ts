import { ParentNodeInfo } from '../../domain/types';
import { ParentNodeInfoResponse } from '../dto';

export class ParentNodeInfoResponseMapper {
	public static mapToResponse(infos: ParentNodeInfo[]): ParentNodeInfoResponse[] {
		const result = infos.map(
			(info) =>
				new ParentNodeInfoResponse({
					id: info.id,
					type: info.type,
					name: info.name,
				})
		);

		return result;
	}
}
