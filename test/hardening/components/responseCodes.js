
//https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

module.exports = {
	"100":"Continue",				//Information responses
	"101":"SwitchingProtocols",
	"200":"OK",						//Successful responses
	"201":"Created",
	"202":"Accepted",
	"203":"Non-AuthoritativeInformation",
	"204":"NoContent",
	"205":"ResetContent",
	"206":"PartialContent",
	"300":"MultipleChoices",		//Redirection messages
	"301":"MovedPermanently",
	"302":"Found",
	"303":"SeeOther",
	"304":"NotModified",
	"307":"TemporaryRedirect",
	"308":"PermanentRedirect",
	"400":"BadRequest",				//Client error responses
	"401":"Unauthorized",
	"403":"Forbidden",
	"404":"NotFound",
	"405":"MethodNotAllowed",
	"406":"NotAcceptable",
	"407":"ProxyAuthenticationRequired",
	"408":"RequestTimeout",
	"409":"Conflict",
	"410":"Gone",
	"411":"LengthRequired",
	"412":"PreconditionFailed",
	"413":"PayloadTooLarge",
	"414":"URITooLong",
	"415":"UnsupportedMediaType",
	"416":"RangeNotSatisfiable",
	"417":"ExpectationFailed",
	"418":"I'mateapot",
	"422":"UnprocessableEntity",
	"426":"UpgradeRequired",
	"428":"PreconditionRequired",
	"429":"TooManyRequests",
	"431":"RequestHeaderFieldsTooLarge",
	"451":"UnavailableForLegalReasons",
	"500":"InternalServerError",	//Server error responses
	"501":"NotImplemented",
	"502":"BadGateway",
	"503":"ServiceUnavailable",
	"504":"GatewayTimeout",
	"505":"HTTPVersionNotSupported",
	"511":"NetworkAuthenticationRequired"
}
//425 is only supported by firefox 58