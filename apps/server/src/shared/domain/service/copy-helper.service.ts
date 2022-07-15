import { Injectable } from '@nestjs/common';
import { CopyStatus, CopyStatusEnum } from '../types';

const isAtLeastPartialSuccessfull = (status) => status === CopyStatusEnum.PARTIAL || status === CopyStatusEnum.SUCCESS;

@Injectable()
export class CopyHelperService {
	deriveStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) => el.status);

		const filtered = elementsStatuses.filter((status) => status !== CopyStatusEnum.NOT_DOING);

		if (filtered.every((status) => !isAtLeastPartialSuccessfull(status))) {
			return CopyStatusEnum.FAIL;
		}

		if (filtered.some((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.PARTIAL;
		}

		return CopyStatusEnum.SUCCESS;
	}

	deriveCopyName(name: string, existingNames?: string[]): string {
		let number = 1;
		let composedName = this.composeCopyName(name, number);
		while (existingNames?.includes(composedName)) {
			number += 1;
			composedName = this.composeCopyName(name, number);
		}
		return composedName;
	}

	private composeCopyName(name: string, num: number): string {
		const matches = name.match(/^(?<name>.*) \((?<number>\d+)\)$/);
		if (matches && matches.groups) {
			name = matches.groups.name;
		}
		return `${name} (${num})`;
	}
}
