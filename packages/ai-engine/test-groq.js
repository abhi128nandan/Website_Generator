require('dotenv').config({path: '../../.env'});
const { ProviderFactory } = require('./dist/providers');

const provider = ProviderFactory.getProvider();
provider.generateJSON(`You are a strict requirement extraction system.
Analyze the following SRS... 

Structure:
{
  "appName": "string",
  "appType": "string",
  "features": ["string"],
  "workflows": ["string"]
}

SRS Content:
To-Do App with tasks and deadlines.`)
.then(console.log)
.catch(console.error);
