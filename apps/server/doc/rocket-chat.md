# Rocket.Chat

## Start Mongodb

It makes sense for Rocket.Chat to launch its own mongodb in Docker. Reason for this is Rocket.Chat requires Mongodb as replicaSet setup.

```bash
docker run --name rocket-chat-mongodb -m=256m -p27030:27017 -d docker.io/mongo --replSet rs0 --oplogSize 10
```

Start mongoDB console and execute

```mongodb
rs.initiate({"_id" : "rs0", "members" : [{"_id" : 0, "host" : "localhost:27017"}]})
```

## Start rocketChat

(check the latest settings <https://github.com/hpi-schul-cloud/dof_app_deploy/blob/main/ansible/roles/rocketchat/templates/configmap.yml.j2#L9>)

Please not that the displayed //172.29.173.128 is the IP address of the mongoDB docker container.
You can get the ip over the command:  docker inspect rocket-chat-mongodb | grep "IPAddress" (dependent on our system)

```bash
docker run\
        -e CREATE_TOKENS_FOR_USERS=true \
        -e MONGO_URL=mongodb://172.29.173.128:27030/rocketchat  \
        -e ADMIN_PASS=huhu  \
        -e API_Enable_Rate_Limiter_Limit_Calls_Default=255  \
        -e Accounts_iframe_enabled=true  \
        -e Accounts_iframe_url=http://localhost:4000/rocketChat/Iframe \
        -e Accounts_Iframe_api_url=http://localhost:4000/rocketChat/authGet \
        -e Accounts_AllowRealNameChange=false \
        -e Accounts_AllowUsernameChange=false \
        -e Accounts_AllowEmailChange=false \
        -e Accounts_AllowAnonymousRead=false \
        -e Accounts_Send_Email_When_Activating=false \
        -e Accounts_Send_Email_When_Deactivating=false \
        -e Accounts_UseDefaultBlockedDomainsList=false \
        -e Analytics_features_messages=false \
        -e Analytics_features_rooms=false \
        -e Analytics_features_users=false \
        -e Statistics_reporting=false \
        -e API_Enable_CORS=true \
        -e Discussion_enabled=false \
        -e FileUpload_Enabled=false \
        -e UI_Use_Real_Name=true \
        -e Threads_enabled=false \
        -e Accounts_SetDefaultAvatar=false \
        -e Iframe_Restrict_Access=false \
        -e Accounts_Iframe_api_method=GET \
        -e OVERWRITE_SETTING_Show_Setup_Wizard='completed' \
        -p 3000:3000 docker.io/rocketchat/rocket.chat:4.7.2
```

## ENVS

You must also configure you server and legacy client application.
Use the .env file in top of the project folders.

### dBildungscloud Backend Server

```env
ROCKETCHAT_SERVICE_ENABLED=true
ROCKET_CHAT_URI="http://localhost:3000"
ROCKET_CHAT_ADMIN_USER=admin
ROCKET_CHAT_ADMIN_PASSWORD=huhu
```

### dBildungscloud Legacy Client

```env
ROCKETCHAT_SERVICE_ENABLED=true
ROCKET_CHAT_URI="http://localhost:3000"
```
