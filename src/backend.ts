import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function newClient(){
    return new pg.Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    });
}

const app= express();

app.use(express.json());
app.use(express.urlencoded());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, code');
    next();
});
app.listen(3000,() =>{
    console.log('Backend is running in 3000')
});


app.get('/verifyCode',async(req,res) =>{
    const code=req.headers.code as string;

    const client= await newClient();
    await client.query('SELECT code FROM private.lobbies WHERE code=$1', [code]).then( () =>{
        res.status(200).send();
    }).catch( () =>{
        res.status(201).send();
    });
});

app.get('/getMap', async(req,res) =>{
    const code=req.headers.code as string;
    const client= await newClient();
    const map= await client.query("SELECT map FROM private.lobbies WHERE code=$1",[code]).catch( (err) =>{
        res.status(400).send();
    });
    res.json(map);
});