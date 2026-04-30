import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import expressWs from 'express-ws';



dotenv.config();


const appExpress= express();
const ws = expressWs(appExpress);
const app=ws.app;



app.ws('/match', (ws, req) => {
    console.log(req.url);
    ws.on('message', msg => {
        console.log(msg)
        ws.send('xd')
    })
});


async function newClient(){
    return new pg.Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    });
}


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
    const client= await newClient();
    await client.connect();
    try {
        for (const carta of cartas_nombre) {

            const result = await client.query("SELECT * FROM private.cartas WHERE nombre=$1",[carta]);
            cartas.push(result.rows[0] as any);
        }

        res.json(cartas);
    } catch (err) {
        console.log(err);
        res.status(400).send();
    } finally {
        client.end();
    }
});

app.post('/newMatch', async (req, res) =>{
    const code=req.headers.code as string;
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any; 
    const mapa=req.body;
    const client=await newClient();
    await client.connect();

    
    try{
        await client.query('INSERT INTO private.lobbies (code,host_id,map) VALUES ($1,$2,$3)',[code,decoded.id,mapa])
    } catch(err){
        console.log(err)
    } finally{
        client.end();
    }
});


app.post('/addOpponent', async (req,res) =>{
    const code=req.headers.code as string;
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any; 
    const client=await newClient();
    await client.connect();
    
    try{
        await client.query('UDPATE private.lobbies SET opponent_id=$1 WHERE code=$2',[decoded.id,code])
        const mapa= await client.query('SELECT private.lobbies.map FROM private.lobbies WHERE code=$1',[code])
        res.json(mapa)
    } catch(err){

    } finally{
        client.end()
    }
});


async function createTokenUser(id:number){
    
    const client= await newClient();
    await client.connect();
    const user_name= await client.query('SELECT private.players.name FROM private.players WHERE private.players.id=$1',[id])
    await client.end();
    return jsonwebtoken.sign({name: user_name, id:id}, (process.env.TOKEN_PRIVATE_KEY as any).replace(/\\n/g, '\n') as any, {algorithm: process.env.TOKEN_DIGEST as any});
}

async function verifyTokenUser(userToken:string){
    return new Promise( (resolve,reject) =>{
        jsonwebtoken.verify(userToken,(process.env.TOKEN_PRIVATE_KEY as string).replace(/\\n/g, '\n'), (err,decoded) =>{
        if (err) reject(false);
        else resolve(decoded);
    });
    });
}