import { Injectable } from '@nestjs/common';
import { CopyStatus, CopyStatusEnum } from '../types';

@Injectable()
export class CopyHelperService {
	inferStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) =>
			el.elements ? this.inferStatusFromElements(el.elements) : el.status
		);

		if (elementsStatuses.every((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.FAIL;
		}

		if (elementsStatuses.some((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.PARTIAL;
		}

		return CopyStatusEnum.SUCCESS;
	}
}
