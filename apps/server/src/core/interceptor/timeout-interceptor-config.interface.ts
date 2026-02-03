export abstract class TimeoutConfig {
	[key: string]: number;

	public incomingRequestTimeout!: number;
}
