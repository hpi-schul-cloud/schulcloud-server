export class MediaSourceVidisConfig {
	public username: string;

	public password: string;

	public baseUrl: string;

	public region: string;

	constructor(props: MediaSourceVidisConfig) {
		this.username = props.username;
		this.password = props.password;
		this.baseUrl = props.baseUrl;
		this.region = props.region;
	}
}
