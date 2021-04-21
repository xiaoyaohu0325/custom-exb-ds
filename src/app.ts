import * as Koa from 'koa';
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as Router from 'koa-router';
import * as koaBody from 'koa-body';
import { auth } from './middleware/auth';
const issueRouter = require('./issue');

let token = null;

const app = new Koa();
const router = new Router();
router.use(auth);

//support cors
app
  // .use(handleProtocol)
  .use(koaBody())
  .use(supportCORS)
  .use(router.routes())
  .use(issueRouter.routes())

// async function handleProtocol(ctx, next) {
//   if(commander.http_only){
//     await next();
//     return;
//   }
//   if(ctx.protocol === 'http'){
//     ctx.URL.protocol = 'https';
//     ctx.URL.port = httpsPort + '';
//     ctx.redirect(ctx.URL.toString());
//   }else{
//     await next();
//   }
// }

app.on('error', err => {
  console.error('server error', err)
});

async function supportCORS(ctx: Koa.Context, next: Koa.Next) {
  ctx.res.setHeader('Access-Control-Allow-Origin', '*');
  ctx.res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
  ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  ctx.res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  await next();
}

router.get('/info', (ctx, next) => {
  ctx.body = {
    version: 0.1
  };
  next();
});

router.get('/arcgis/rest/info', (ctx, next) => {
  ctx.body = {
    "currentVersion":10.71,
    "fullVersion":"10.7.1",
    "soapUrl":"http://sampleserver6.arcgisonline.com/arcgis/services",
    "secureSoapUrl":"https://sampleserver6.arcgisonline.com/arcgis/services",
    "authInfo":{
      "isTokenBasedSecurity":false,
      // "tokenServicesUrl":"https://sampleserver6.arcgisonline.com/arcgis/tokens/",
      // "shortLivedTokenValidity":60
    }
  };
  next();
});

// router.get('/login', (ctx, next) => {
//   ctx.body = {
//     url: `https://devtopia.esri.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=http://locallhost:3000/oauth-callback`
//   };
//   next();
// });

// router.get('/oauth-callback', (req, res) => {
//   const body = {
//     client_id: clientId,
//     client_secret: clientSecret,
//     code: req.query.code
//   };
//   const opts = { headers: { accept: 'application/json' } };
//   axios.post(`https://devtopia.esri.com/login/oauth/access_token`, body, opts)
//     .then(res => res.data['access_token'])
//     .then(_token => {
//       console.log('My token:', token);
//       token = _token;
//       ctx.body = {
//         ok: 1,
//         token: token
//       };
//       next();
//     })
//     .catch(err => res.status(500).json({ message: err.message }));
// });

http.createServer(app.callback()).listen(4000);
const options = {
  key: fs.readFileSync(path.join(__dirname, "./cert/server.key"), "utf8"),
  cert: fs.readFileSync(path.join(__dirname, "./cert/server.cert"), "utf8")
};
https.createServer(options, app.callback()).listen(4003);
console.log('App listening on port 4000');