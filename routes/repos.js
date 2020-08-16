var express = require('express');
const { json } = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const redis = require('redis');

const REDIS_PORT=process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next){
  try {
    console.log("Fetching data...");
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    const repos = data.public_repos;
    // Set data to Redis
    client.setex(username, 3600, repos)
    res.send(setResponse(username, repos));
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

// Chache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if(err) throw err;

    if (data != null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  })
}

/* GET users listing. */
router.get('/:username', cache, getRepos);

module.exports = router;
