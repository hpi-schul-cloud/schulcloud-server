const errors = require('feathers-errors');
const promisify = require('es6-promisify');
const logger = require('winston');
const lti = require('lti');
const LtiTool = require('./model');

module.exports = function(app) {
    const docs = {
        // TODO: Create Swagger Doc
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
                lis_person_name_full: 'John Logie Baird',
            };

            ltiTool.customs.forEach((custom) => {
               payload[LtiTool.customFieldToString(custom)] = custom.value;
            });

            return session.basicLaunch(payload).
                then((response) => {
                    return Promise.resolve(response.getOrElse(''));
                }).catch((e) => {
                    return Promise.reject(e);
            });
        });
    }

    return LtiToolsService;
};
