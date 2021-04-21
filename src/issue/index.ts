import * as Router from 'koa-router';
import { Octokit } from "@octokit/rest";
import config from '../config';
import { auth } from '../middleware/auth';
import * as Koa from 'koa';
const schema = require('./schema.json');

const { access_token, repos } = config;

const octokit = new Octokit({
  auth: access_token,
  baseUrl: 'https://devtopia.esri.com/api/v3'
});

const router = new Router({ prefix: '/arcgis/rest/services/devtopia/FeatureServer/0' });
router.use(auth);

router.get('/', (ctx: Koa.Context) => {
  ctx.body = schema;
});

router.get('/query', async (ctx: Koa.Context) => {
  const {
    objectIds,
    returnCountOnly,
  } = ctx.query;
  if (returnCountOnly) {
    const result = await countIssues();
    ctx.body = {count: result};
    return;
  }
  // query features
  const issues = await getIssues();
  const result = {
    objectIdFieldName: 'ObjectID',
    fields: [
      {name: 'ObjectID', type: 'esriFieldTypeOID', alias: 'OBJECTID'},
      {name: 'url', type: 'esriFieldTypeString', alias: 'URL'},
      {name: 'user', type: 'esriFieldTypeString', alias: 'USER'},
      {name: 'labels', type: 'esriFieldTypeString', alias: 'LABELS'},
      {name: 'assignees', type: 'esriFieldTypeString', alias: 'ASSIGNEES'},
    ],
    features: []
  }
  issues.data.forEach(item => {
    const dataItem = {
      attributes: {
        ObjectID: item.number,
        url: item.url,
        user: item.user.login,
        labels: item.labels.map(label => (label as any)?.name ?? label).join(','),
        assignees: item.assignees?.map(assignee => assignee.login).join(',')
      }
    }
    result.features.push(dataItem);
  });
  ctx.body = result;
});

async function getUserList() {
  // return await octokit.rest.users.list();
  return await octokit.rest.orgs.listMembers({
    org: repos[0].org,
  });
}

async function getIssues() {
  return octokit.rest.issues.list({
    state: 'open',
    repo: repos[0].repo,
  });
}

async function countIssues() {
  const result = octokit.rest.issues.list({
    state: 'open',
    repo: repos[0].repo,
    per_page: 1
  });
  const matches = (result as any).headers.link.match(/page=(\d+)>; rel="last"/)
  if (matches.length > 1) {
    return matches[1];
  } else {
    return 100;
  }
}

module.exports = router;