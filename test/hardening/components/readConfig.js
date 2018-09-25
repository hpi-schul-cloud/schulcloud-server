/** example config
{
	"model":{
		"firstName":"automatically",
		"lastName":"createByHardeningTest"
	},
	"moongose": {
		"path":"user/model.js",
		"model":"userModel"
	},
	"id":"123",
	"responses":[
		{
			"methods":["GET","FIND"],
			"roles":["student","teacher"],
			"code":404,
			"response":{},
			"query":{				
				"id":"123",			
				"age":"18"		
			}
		}
		
	]
}
***/
/**
 mapping from 
	{{id=my_super_id_123}} <--set id
	{{id}} --> use id
	
	{{userId}}  
	{{accountId}}  
	{{schoolId}}  
	{{id}}  
**/
const tags = (str,{schoolId,accountId,userId,id}) =>{
	if(str===undefined) 
		return str
	else{
		let bool=false;
		if(typeof str==='object'){
			str=JSON.stringify(str);
			bool=true;
		}

		 str
		.replace(/{{userId}}/g,userId)
		.replace(/{{accountId}}/g,accountId)
		.replace(/{{schoolId}}/g,schoolId)
		.replace(/{{id}}/g,id)
		
		if(bool){
			str=JSON.parse(str);
		}
		return str
	}
}

const readConfig=(method,route,login)=>{
	const config = route.config;
	const name   = login.user.firstName;
	let data     = (config||{}).model || null;
	let code     = 200;
	let query    = {};
	let response =  null;
	let id		 = (config||{}).id || null;
	
	const optStatic = {
		'schoolId':login.schoolId,
		'accountId':login.account._id,
		'userId':login.user._id,
		id
	}
	
	id   = tags(id,optStatic);		//to map some of the other statics
	data = tags(data,optStatic);	//use statics

	if( config===null || config===undefined ){
		return {id,query,code,response,data}
	}

	if( config.responses && config.responses.length>0 ){
		config.responses.forEach(res=>{
			if( res.methods.includes(method) && res.roles.includes(name) ){
				code     = res.code;
				query    = res.query;
				response = tags(res.response,optStatic);	//use statics
			}
		});
	}
	
	return {
		id,
		query,
		code,
		response,
		data
	}
}

module.exports = readConfig;