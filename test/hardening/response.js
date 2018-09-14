//https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

const not_supported={
	"name":"MethodNotAllowed",
	"message":"Method `get` is not supported by this endpoint.",		//regex for get
	"code":405,
	"className":"method-not-allowed",
	"errors":{}
};

const not_supported={
    "name": "BadRequest",
    "message": "Missing credentials",
    "code": 400,
    "className": "bad-request",
    "data": {
        "message": "Missing credentials"
    },
    "errors": {}
}

