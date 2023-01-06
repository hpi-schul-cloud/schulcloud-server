import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../entity';
import { CopyStatus, CopyStatusEnum, EntityId } from '../types';

const isAtLeastPartialSuccessfull = (status) => status === CopyStatusEnum.PARTIAL || status === CopyStatusEnum.SUCCESS;

@Injectable()
export class CopyHelperService {
	deriveStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) => el.status);

		const filtered = elementsStatuses.filter((status) => status !== CopyStatusEnum.NOT_DOING);

		if (filtered.length > 0) {
			if (filtered.every((status) => !isAtLeastPartialSuccessfull(status))) {
				return CopyStatusEnum.FAIL;
			}

			if (filtered.some((status) => status !== CopyStatusEnum.SUCCESS)) {
				return CopyStatusEnum.PARTIAL;
			}
		}

		return CopyStatusEnum.SUCCESS;
	}

	deriveCopyName(name: string, existingNames: string[] = []): string {
		if (!existingNames.includes(name)) {
			return name;
		}
		let num = 1;
		const matches = name.match(/^(?<name>.*) \((?<number>\d+)\)$/);
		if (matches && matches.groups) {
			name = matches.groups.name;
			num = Number(matches.groups.number) + 1;
		}
		const composedName = `${name} (${num})`;
		if (existingNames.includes(composedName)) {
			return this.deriveCopyName(composedName, existingNames);
		}
		return composedName;
	}

	buildCopyEntityDict(status: CopyStatus): Map<EntityId, BaseEntity> {
		const map = new Map<EntityId, BaseEntity>();
		status.elements?.forEach((elementStatus: CopyStatus) => {
			this.buildCopyEntityDict(elementStatus).forEach((el, key) => map.set(key, el));
		});
		if (status.originalEntity && status.copyEntity) {
			map.set(status.originalEntity.id, status.copyEntity);
		}
		return map;
	}
}
