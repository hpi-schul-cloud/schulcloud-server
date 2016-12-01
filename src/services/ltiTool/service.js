const errors = require('feathers-errors');
const promisify = require('es6-promisify');
const logger = require('winston');
const lti = require('lti');
const LtiTool = require('./model');

module.exports = function(app) {
	const docs = {
		create: {
			//type: 'Example',
			parameters: [{
					description: 'the database id of the ltiTool',
					//in: 'path',
					required: true,
					name: 'toolId',
					type: 'string'
				}],
			summary: 'Connects to the given ltiTool-provider via LTI ',
			notes: 'Returns a redirecting html or url'
			//errorResponses: []
		}
	};

    class LtiToolsService {
        constructor() {
            this.docs = docs;
        }
        // POST /ltitools/connect
        create({toolId, user_id, roles, lis_person_name_full}, params) {
            return LtiTool.findOne({'_id':toolId}).then((ltiTool) => {
                if(!ltiTool) throw new errors.NotFound(`no tool found for given toolId ${toolId}`);

                return makeLtiRequest(ltiTool);
            });
        }
    }

    function makeLtiRequest(ltiTool) {
        var consumer = new lti.ToolConsumer(ltiTool.url, ltiTool.key, ltiTool.secret);
        return consumer.withSession(function(session) {
            var payload = {
                lti_version: ltiTool.lti_version,
                lti_message_type: ltiTool.lti_message_type,
                resource_link_id: ltiTool.resource_link_id,
                user_id: '29123',
                roles: 'Learner',
				launch_presentation_document_target: 'window',
                lis_person_name_full: 'John Logie Baird',
            };

            ltiTool.customs.forEach((custom) => {
               payload[LtiTool.customFieldToString(custom)] = custom.value;
            });

            return session.basicLaunch(payload).
                then((response) => {
					var keep = response.getOrElse('');
					if (!keep.includes('<head>')) {
						let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
						let regex = new RegExp(expression);
						keep = { data: keep.match(regex).toString(), type: 'url' };
					} else {
						keep = { data: keep, type: 'html'};
					}
                    return Promise.resolve(keep);
                }).catch((e) => {
                    return Promise.reject(e);
            });
        });
    }

    return LtiToolsService;
};
