require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

const githubData = [ {
  "login": "samshatan",
  "id": 184090876,
  "node_id": "U_kgDOCvkA_A",
  "avatar_url": "https://avatars.githubusercontent.com/u/184090876?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/samshatan",
  "html_url": "https://github.com/samshatan",
  "followers_url": "https://api.github.com/users/samshatan/followers",
  "following_url": "https://api.github.com/users/samshatan/following{/other_user}",
  "gists_url": "https://api.github.com/users/samshatan/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/samshatan/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/samshatan/subscriptions",
  "organizations_url": "https://api.github.com/users/samshatan/orgs",
  "repos_url": "https://api.github.com/users/samshatan/repos",
  "events_url": "https://api.github.com/users/samshatan/events{/privacy}",
  "received_events_url": "https://api.github.com/users/samshatan/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": null,
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": null,
  "twitter_username": null,
  "public_repos": 4,
  "public_gists": 0,
  "followers": 1,
  "following": 3,
  "created_at": "2024-10-07T08:35:45Z",
  "updated_at": "2025-06-01T14:55:50Z"
},
{
  "login": "Sanasaifi786",
  "id": 184926081,
  "node_id": "U_kgDOCwW_gQ",
  "avatar_url": "https://avatars.githubusercontent.com/u/184926081?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/Sanasaifi786",
  "html_url": "https://github.com/Sanasaifi786",
  "followers_url": "https://api.github.com/users/Sanasaifi786/followers",
  "following_url": "https://api.github.com/users/Sanasaifi786/following{/other_user}",
  "gists_url": "https://api.github.com/users/Sanasaifi786/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/Sanasaifi786/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/Sanasaifi786/subscriptions",
  "organizations_url": "https://api.github.com/users/Sanasaifi786/orgs",
  "repos_url": "https://api.github.com/users/Sanasaifi786/repos",
  "events_url": "https://api.github.com/users/Sanasaifi786/events{/privacy}",
  "received_events_url": "https://api.github.com/users/Sanasaifi786/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": null,
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": null,
  "twitter_username": null,
  "public_repos": 3,
  "public_gists": 0,
  "followers": 0,
  "following": 0,
  "created_at": "2024-10-14T09:31:30Z",
  "updated_at": "2025-08-20T18:44:53Z"
}
]

app.get('/', (req,res)=>{
    res.send('Hello World')
})

app.get('/twitter',(req,res)=>{
    res.send('samshatan')
})

app.get('/login', (req,res)=>{
    res.send('<h1>Please Login at my website</h1>')
})

app.get('/youtube', (req,res)=>{
    res.send('<h2> Hello everyone</h2>')
})

app.get('/github',(req,res)=>{
    res.json(githubData)
})

app.listen(process.env.port,()=>{
    console.log(`Example app listening to port ${port}`)
})

