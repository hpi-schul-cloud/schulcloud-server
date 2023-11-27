export class CookiesDto {
	hydraCookies: string[];

	localCookies: string[];

	constructor(props: CookiesDto) {
		this.localCookies = props.localCookies;
		this.hydraCookies = props.hydraCookies;
	}
}
