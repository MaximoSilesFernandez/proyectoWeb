import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function newClient(){
    return new pg.Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    });
}

const app= express();

app.use(express.json());
app.use(express.urlencoded());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, code, cartas');
    next();
});
app.listen(3000,() =>{
    console.log('Backend is running in 3000')
});


app.get('/verifyCode',async (req,res) =>{
    const code=req.headers.code as string;

    const client= await newClient();
    await client.query('SELECT code FROM private.lobbies WHERE code=$1', [code]).then( () =>{
        res.status(200).send();
    }).catch( () =>{
        res.status(201).send();
    });
    client.end();
});

app.get('/getMap', async (req,res) =>{
    const code=req.headers.code as string;
    const client= await newClient();
    const map= await client.query("SELECT map FROM private.lobbies WHERE code=$1",[code]).catch( (err) =>{
        res.status(400).send();
    });
    client.end();
    res.json(map);
});

app.get('/getCarta', async (req,res) =>{
    const cartas_nombre=((req.headers.cartas as string).split(",")) as string[];
    const cartas=[];
    console.log(cartas_nombre);
    const client= await newClient();
    await client.connect();
    try {
        for (const carta of cartas_nombre) {
            console.log(carta);
            const result = await client.query("SELECT * FROM private.cartas WHERE nombre=$1",[carta]);
            cartas.push(result.rows[0] as any);
        }
        console.log(cartas);
        res.json(cartas);
    } catch (err) {
        console.log(err);
        res.status(400).send();
    } finally {
        client.end();
    }
})