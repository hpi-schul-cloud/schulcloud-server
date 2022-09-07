export class CookiesDto {
	hydraCookie: string;

	localCookie: string;

	constructor(props: CookiesDto) {
		this.localCookie = props.localCookie;
		this.hydraCookie = props.hydraCookie;
	}
}
