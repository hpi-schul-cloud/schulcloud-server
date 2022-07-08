import { Injectable } from '@nestjs/common';
import { CopyStatus, CopyStatusEnum } from '../types';

const isAtLeastPartialSuccessfull = (status) => status === CopyStatusEnum.PARTIAL || status === CopyStatusEnum.SUCCESS;

@Injectable()
export class CopyHelperService {
	deriveStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) => el.status);

		if (elementsStatuses.every((status) => !isAtLeastPartialSuccessfull(status))) {
			return CopyStatusEnum.FAIL;
		}

		if (elementsStatuses.some((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.PARTIAL;
		}

		return CopyStatusEnum.SUCCESS;
	}

	deriveCopyName(name: string): string {
		let number = 1;
		const matches = name.match(/^(?<name>.*) \((?<number>\d+)\)$/);
		if (matches && matches.groups) {
			name = matches.groups.name;
			number = Number(matches.groups.number) + 1;
		}
		return `${name} (${number})`;
	}
}
