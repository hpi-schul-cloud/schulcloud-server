export class TimestampResponseDto {
	lastUpdatedAt: string;

	createdAt: string;

	deletedAt?: string;

	constructor(props: Readonly<TimestampResponseDto>) {
		this.lastUpdatedAt = props.lastUpdatedAt;
		this.createdAt = props.createdAt;
		this.deletedAt = props.deletedAt;
	}
}
