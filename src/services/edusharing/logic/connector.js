const request = require("request-promise-native");
// const feathersError = require('@feathersjs/errors');
const url = require("url");

const REQUEST_TIMEOUT = 8000; // ms

function validURL(str) {
	const pattern = new RegExp(
		"^(https?:\\/\\/)?" +
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
			"((\\d{1,3}\\.){3}\\d{1,3}))" +
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
			"(\\?[;&a-z\\d%_.~+=-]*)?" +
			"(\\#[-a-z\\d_]*)?$",
		"i"
	);
	return !!pattern.test(str);
}

class EduSharingConnector {
	constructor() {
		if (EduSharingConnector.instance) {
			return EduSharingConnector.instance;
		}
		if (!validURL(this.url)) {
			return "Invalid ES_DOMAIN, check your .env";
		}
		this.authorization = null;
		EduSharingConnector.instance = this;
	}

	static get headers() {
		return {
			Accept: "application/json",
			"Content-type": "application/json"
		};
	}

	static get authorization() {
		const userName = process.env.ES_USER;
		const pw = process.env.ES_PASSWORD;

		const headers = Object.assign({}, EduSharingConnector.headers, {
			Authorization: `Basic ${Buffer.from(`${userName}:${pw}`).toString(
				"base64"
			)}`
		});
		return headers;
	}
	// todo, path combine with URL
	getCookie() {
		const cookieOptions = {
			uri: `${process.env.ES_DOMAIN}/edu-sharing/rest/authentication/v1/validateSession`,
			method: "GET",
			headers: EduSharingConnector.authorization,
			resolveWithFullResponse: true,
			json: true
		};
		return request(cookieOptions)
			.then(result => {
				console.log(result.statusCode === 200, "statusCode");
				console.log(result.body.isValidLogin === true, "validLogin");
				if (
					result.statusCode !== 200 ||
					result.body.isValidLogin !== true
				) {
					throw Error("authentication error with edu sharing");
				}
				return result.headers["set-cookie"][0];
			})
			.catch(err => {
				// eslint-disable-next-line no-console
				console.error("error: ", err);
			});
	}

	checkEnv() {
		return (
			process.env.ES_DOMAIN &&
			process.env.ES_USER &&
			process.env.ES_PASSWORD
		);
	}

	async login() {
		this.authorization = await this.getCookie();
	}

	isLoggedin() {
		return !!this.authorization;
	}

	async GET(data) {
		const myVar = process.env.ES_DOMAIN; // "https://mv-repo.schul-cloud.org"
		const myHost = process.env.HOST; // "http://localhost:3030"

		// proxy task
		if (data.mode && data.mode === "preview") {
			console.log(data.params, "paramsurl");
			const newUrl = new url.URL(
				"/edu-sharing/preview",
				process.env.ES_DOMAIN
			);
			const modeOptions = {
				method: "GET",
				resolveWithFullResponse: true,
				transform: function(body) {
					return body;
				},
				qs: data.params.query,
				url: newUrl.toString(),
				headers: Object.assign(
					{},
					{
						cookie: this.authorization
					}
				)
			};
			return request(modeOptions);
		}
		const limit = data.query.$limit || 9;
		const skip = data.query.$skip || 0;
		const searchWord = data.query.searchWord || "img"; // will give pictures of flowers as default
		const contentType = data.query.contentType || "FILES"; // enum: ['FILES', FILES_AND_FOLDERS,COLLECTIONS, TOOLPERMISSIONS, ALL]

		if (!this.checkEnv()) {
			return "Update your env variables. See --> src/services/edusharing/envTemplate";
		}

		if (this.isLoggedin() === false) {
			await this.login();
		}
		console.log(searchWord, "searchword");
		const options = {
			method: "POST",
			url: `${process.env.ES_DOMAIN}/edu-sharing/rest/search/v1/queriesV2/mv-repo.schul-cloud.org/mds/ngsearch/?contentType=${contentType}&skipCount=${skip}&maxItems=${limit}&sortProperties=score&sortProperties=cm%3Amodified&sortAscending=false&sortAscending=false&propertyFilter=-all-&`,
			headers: Object.assign({}, EduSharingConnector.headers, {
				cookie: this.authorization
			}),
			body: JSON.stringify({
				criterias: [
					{ property: "ngsearchword", values: [`${searchWord}`] }
				],
				facettes: ["cclom:general_keyword"]
			}),
			timeout: REQUEST_TIMEOUT
		};

		const eduResponse = await request(options);
		const regex = new RegExp(process.env.ES_DOMAIN, "g");
		const parsed = JSON.parse(eduResponse.replace(regex, process.env.HOST));

		return parsed;
	}

	static get Instance() {
		if (!EduSharingConnector.instance) {
			return new EduSharingConnector();
		}
		return EduSharingConnector.instance;
	}
}

module.exports = EduSharingConnector.Instance;
