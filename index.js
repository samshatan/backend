require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

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

app.listen(process.env.port,()=>{
    console.log(`Example app listening to port ${port}`)
})

