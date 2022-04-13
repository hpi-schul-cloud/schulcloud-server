import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain';
import { OperationStatus, OperationStatusEnum } from '@shared/domain/entity/operation-status.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class OperationStatusRepo extends BaseRepo<OperationStatus> {
	get entityName() {
		return OperationStatus;
	}

	async LogOperationStart(title: string, original?: EntityId): Promise<OperationStatus> {
		const result = new OperationStatus({
			title,
			status: OperationStatusEnum.STARTED,
			originalId: original,
		});
		await this.save(result);
		return Promise.resolve(result);
	}

	async LogOperationSuccess(title: string, original: EntityId): Promise<OperationStatus> {
		const result = new OperationStatus({
			title,
			status: OperationStatusEnum.SUCCESSFUL,
			originalId: original,
		});
		await this.save(result);
		return Promise.resolve(result);
	}

	async LogOperationFailure(title: string, original: EntityId): Promise<OperationStatus> {
		const result = new OperationStatus({
			title,
			status: OperationStatusEnum.FAILED,
			originalId: original,
		});
		await this.save(result);
		return Promise.resolve(result);
	}

	async FindOperationEntries(id: EntityId): Promise<Counted<OperationStatus[]>> {
		const [entries, count] = await this._em.findAndCount(OperationStatus, { $or: [{ id }, { original: id }] });
		return [entries, count];
	}
}
