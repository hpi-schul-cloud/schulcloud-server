export class TimestampResponseDto {
	public lastUpdatedAt: string;

	public createdAt: string;

	public deletedAt?: string;

	constructor(props: Readonly<TimestampResponseDto>) {
		this.lastUpdatedAt = props.lastUpdatedAt;
		this.createdAt = props.createdAt;
		this.deletedAt = props.deletedAt;
	}
}
