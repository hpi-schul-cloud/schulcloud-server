export class MediaSourceBasicAuthConfig {
	public username: string;

	public password: string;

	public authEndpoint: string;

	constructor(props: MediaSourceBasicAuthConfig) {
		this.username = props.username;
		this.password = props.password;
		this.authEndpoint = props.authEndpoint;
	}
}
