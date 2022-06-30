import { Injectable } from '@nestjs/common';
import { CopyStatus, CopyStatusEnum } from '../types';

@Injectable()
export class CopyHelperService {
	deriveStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) =>
			el.elements ? this.deriveStatusFromElements(el.elements) : el.status
		);

		if (elementsStatuses.every((status) => status !== CopyStatusEnum.SUCCESS)) {
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
