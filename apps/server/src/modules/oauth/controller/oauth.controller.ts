/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios, { AxiosResponse } from 'axios';
import { env } from 'process';
import jwtDecode from 'jwt-decode';
import { OauthUc } from '../uc/oauth.uc';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}

	@Get()
	getAuthorizationCode(@Query() query, @Res() res) {
		if (!query.hasOwnProperty('code')) return 'no code property found.';
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		console.log('#################### Code #################');
		console.log(query.code);
		void this.requestToken(query.code);

		return res.redirect('https://google.de');
	}

	async requestToken(code: string) {
		const payload = {
			url: 'http://iserv.n21.dbildungscloud.de/iserv/auth/public/token',
			data: {
				client_id: '58_qe54d8bh0v4gog8sw0w88c0s8cwwocc8wk8oo00s4c0g8gkc8',
				client_secret: env.CLIENT_SECRET,
				redirect_uri: 'http://localhost:3030/api/v3/oauth/token',
				grant_type: 'authorization_code',
				code,
			},
		};

		try {
			console.log(payload);
			const response: AxiosResponse = await axios.post(payload.url, {}, { params: { ...payload.data } });
			console.log('############################ RESPONSE #############################');
			console.log(response.data);
			const decodedJwt: IJWT = jwtDecode(response.data.id_token);
			console.log(`This is the uuid >>>> ${decodedJwt.uuid}`);
		} catch (error) {
			console.log('############################ ERROR #############################');
			console.log(error.message);
		}
	}
}

interface IJWT {
	hmmmm: string;
	uuid: string;
}
