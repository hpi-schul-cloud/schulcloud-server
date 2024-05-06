import { Injectable } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { CopyDictionary, CopyStatus, CopyStatusEnum } from '../types/copy.types';

const isAtLeastPartialSuccessfull = (status) => status === CopyStatusEnum.PARTIAL || status === CopyStatusEnum.SUCCESS;

@Injectable()
export class CopyHelperService {
	deriveStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) => el.status);

		for (const element of elements) {
			if (element.elements?.length) {
				element.status = this.deriveStatusFromElements(element.elements);
			} else {
				return element.status;
			}
		}

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
			({ name } = matches.groups);
			num = Number(matches.groups.number) + 1;
		}
		const composedName = `${name} (${num})`;
		if (existingNames.includes(composedName)) {
			return this.deriveCopyName(composedName, existingNames);
		}
		return composedName;
	}

	buildCopyEntityDict(status: CopyStatus): CopyDictionary {
		const map = new Map<EntityId, AuthorizableObject>();
		status.elements?.forEach((elementStatus: CopyStatus) => {
			this.buildCopyEntityDict(elementStatus).forEach((el, key) => map.set(key, el));
		});
		if (status.originalEntity && status.copyEntity) {
			map.set(status.originalEntity.id, status.copyEntity);
		}
		return map;
	}
}
