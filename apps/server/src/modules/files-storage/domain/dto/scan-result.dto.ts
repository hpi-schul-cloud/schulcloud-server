import { ScanStatus } from '..';

export class ScanResultDto {
	public status: ScanStatus;

	public reason: string;

	constructor(props: ScanResultDto) {
		this.status = props.status;
		this.reason = props.reason;
	}
}
