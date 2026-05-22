import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import crypto from 'crypto';


dotenv.config();
const appExpress= express();
const ws = expressWs(appExpress);
const app=ws.app;
const clientMatches=new Map<String,String[]>();
const clients=new Map<String,any>();
let comienza: string;


app.ws('/match', async (ws, req) => {
    const token=req.query.token as string
    const room=req.query.room as string

    clients.set(token as string,ws); 

    if (!clientMatches.get(room)){
        clientMatches.set(room, [token])

    } else{
        const value=clientMatches.get(room) as any[];
        if (!value.includes(token)){

            value.push(token);
            clientMatches.set(room, value);

            if (clientMatches.get(room)?.length==2){

                const players=clientMatches.get(room) as string[];

                await createLobby(room,players[0] , players[1]).then( () =>{
                    const two_players=[] as any[];

                    for (const player of players){
                        two_players.push(clients.get(player));
                    }

                    two_players.forEach( (player) =>{
                        player.send(JSON.stringify({msg:'matchBegin',first_turn: comienza}));
                    });

                }).catch(err =>{});

            }
        }
    }
    ws.on('open', () =>{});


    ws.on('message', async (msg:string) => {
        const mensage=JSON.parse(msg);
        const tokens=clientMatches.get(mensage.code as string) as string[];
        const players=[] as any[];

        if (!tokens) return;

        for (const token of tokens){
            players.push(clients.get(token));
        }

        if (mensage.msg==='endMatch'){
            for (const player of tokens){
                clients.delete(player);
            }

            clientMatches.delete(mensage.code as string);
            await deleteMatch(mensage.code as string);

        } else if (mensage.msg==='getTablero'){

            const mapa=await getMap(mensage.code) as string;

            if (mapa && players.length>=2){
                const turno=( await getTurn(mensage.code as string));
                players.forEach(player  => {
                    player.send(JSON.stringify({mapa: mapa, msg:'sendTablero', newTurn: turno.turn}));
                });

            } else if (!mapa){

                players.forEach(player  => {
                    player.send(JSON.stringify({mapa: '', msg:'createTablero'}));
                });
            }

        } else if(mensage.msg==='updateTablero'){

            await updateMap(mensage.code,mensage.tablero,mensage.newTurn);
            const mapa=await getMap(mensage.code) as string;
            players.forEach(player  => {
                    player.send(JSON.stringify({mapa: mapa, msg:'sendTablero', newTurn : mensage.newTurn}));
            });

        } else if (mensage.msg==='getHand'){

            const hand=await getHand(mensage.code,mensage.rol); 
            ws.send(JSON.stringify({hand: hand, msg : 'sendHand'}))

        } else if (mensage.msg==='updateHand'){

            await updateHand(mensage.code,mensage.rol, mensage.hand); 
            const hand=await getHand(mensage.code,mensage.rol); 
            ws.send(JSON.stringify({hand: hand, msg : 'sendHand'}));
        }

    })

    
});

async function getHand(code:string,rol:string) {
    const client= await newClient();
    await client.connect();

    try{
        return (await client.query(`SELECT private.lobbies.${rol}_hand FROM private.lobbies WHERE code=$1`,[code]) as any).rows[0];
    } catch (err){
        console.log(err)
    } finally{
        client.end();
    }
}

async function updateHand(code:string,rol:string,newHand:string){
    const client= await newClient();
    await client.connect();

    try{
        await client.query(`UPDATE private.lobbies SET ${rol}_hand=$1 WHERE code=$2`,[newHand,code]);
    } catch (err){
        console.log(err)
    } finally{
        client.end();

    }
}


let clientEvent=new Map<String,any>();

app.ws('/events', async (ws,req) =>{

    clientEvent.set(req.query.token as string,ws);

    ws.on('message', async (msg: string) =>{
        const mensage=JSON.parse(msg);
        const attack=mensage.attack as string[];
        const combo=mensage.combo as string[];
        const tokens=clientMatches.get(mensage.code as string) as string[];
        const players=[] as any[];

        for (const token of tokens){
            players.push(clientEvent.get(token));
        }
        players.forEach(player =>{
            player.send(JSON.stringify({attack: attack, mapa: mensage.tablero, combo: combo, res_battle: mensage.res_battle, turn: mensage.turn}))
        })
    })
    ws.on('open', () =>{});
    
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, code, cartas, rol');
    next();
});
app.listen(3000,() =>{
    console.log('Backend is running in 3000')
});

async function deleteMatch(code:string){
    const client= await newClient();
    await client.connect();

    try{
        await client.query('DELETE FROM private.lobbies WHERE code=$1',[code]);
        await client.query('DELETE FROM private.tablero WHERE code=$1',[code]);
    } catch (err){
        console.log(err);
    } finally{
        client.end();
    }
    
}

async function createLobby(code:string,host_token:string,opp_token:string){
    const decoded_host=await verifyTokenUser(host_token) as any;
    const decoded_opp=await verifyTokenUser(opp_token) as any;
    const client= await newClient();
    await client.connect();
    
    try{
        await client.query('INSERT INTO private.lobbies(code,host_id,opponent_id,map) VALUES ($1,$2,$3,$4);',[code,parseInt(decoded_host.id),parseInt(decoded_opp.id),code])
        
    } catch (err){
        console.log(err);
        throw err;
    } finally{
        client.end();
    }

}

async function getTurn(code: string){
    const client= await newClient();
    await client.connect();

    try{
        return (await client.query(`SELECT private.lobbies.turn FROM private.lobbies WHERE private.lobbies.code=$1 `,[code]) as any).rows[0]
    } catch (err){
        console.log(err);
    } finally{
        client.end();
    }
}


async function updateMap(code:string,new_mapa:string[], turn:number){
    const client= await newClient();
    await client.connect();

    try{
        for (let i = 1; i < 17; i++) {
            await client.query(`UPDATE private.tablero SET c_${i}=$1 WHERE code=$2`,[new_mapa[i-1],code])
        }
        await client.query(`UPDATE private.lobbies SET turn=$1 WHERE code=$2`,[turn,code])
    } catch(err){
        console.log(err)
    } finally{
        client.end();
    }
}


async function getMap(code:string){
    const client= await newClient();
    let mapa="";
    await client.connect();

    try{
        for (let i = 1; i < 17; i++) {
            const casilla=(await client.query(`SELECT c_${i} FROM private.tablero WHERE code=$1`,[code])).rows[0];
            if (!casilla) return undefined;
            mapa+=(Object.values(casilla)[0]);
        }
        return mapa;
    } catch (err){
        console.log(err)
    } finally{
        client.end();
    }
}

app.get('/determineRol', async (req , res)=>{
    const code=req.headers.code as string;
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    const client=await newClient();
    await client.connect();

    try{
        const lobby=(await client .query('SELECT * FROM private.lobbies WHERE code=$1',[code])).rows[0] as any;
        if (lobby) {
            const supposed_id=(await client .query('SELECT opponent_id FROM private.lobbies WHERE code=$1',[code])).rows[0].opponent_id as any;
            res.json( (supposed_id===decoded.id)? 'opponent':'spectator');
        } else{
            res.json('opponent');
        }
    } catch(err){
        return 'spectator';
    } finally{
        client.end();
    } 
});

app.get('/getCarta', async (req,res) =>{
    const cartas_nombre=((req.headers.cartas as string).split(",")) as string[];
    const cartas=[];
    const client= await newClient();
    await client.connect();

    try {
        for (const carta of cartas_nombre) {
            let result ;
            if (carta==''){
                result=`{name: 'empty', info: '', directions: '', team: ''}`
            } else{
                result = (await client.query("SELECT * FROM private.cartas WHERE nombre=$1",[carta])).rows[0];
            }
            cartas.push(result as any);
        }
        res.json(cartas);
    } catch (err) {
        res.status(400).send();
    } finally {
        client.end();
    }
});

app.post('/newMatch', async (req, res) =>{
    const code=req.body.code as string;
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    if (!decoded) return; 
    const mapa=req.body.mapa;
    const client=await newClient();
    await client.connect();

    try{
        await client.query('INSERT INTO private.tablero (code) VALUES ($1)',[code]);
        for (let i = 1; i < 17; i++) {
            await client.query(`UPDATE private.tablero SET c_${i}=$1 WHERE code=$2`,[mapa[i-1],code])
        }
        comienza=((Math.random()*100<50)? 'host' : 'opponent');
        res.send();
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
        await client.query('UPDATE private.lobbies SET opponent_id=$1 WHERE code=$2',[decoded.id,code])
        const mapa= await client.query('SELECT private.lobbies.map FROM private.lobbies WHERE code=$1',[code])
        res.json(mapa)
    } catch(err){

    } finally{
        client.end()
    }
});

app.post('/updateStats', async (req,res) =>{
    const code=req.body.code as string;
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    const client=await newClient();
    await client.connect();
    const opp_id= (await client.query('SELECT opponent_id FROM private.lobbies WHERE code=$1',[code])).rows[0].opponent_id;

    try{
        if (req.body.result=='win'){
            await client.query('UPDATE private.estadistica SET wins=wins+1 WHERE player_id=$1',[decoded.id]);
            await client.query('UPDATE private.estadistica SET losses=losses+1 WHERE player_id=$1',[opp_id]);
        } else if (req.body.result=='loss'){
            await client.query('UPDATE private.estadistica SET losses=losses+1 WHERE player_id=$1',[decoded.id]);
            await client.query('UPDATE private.estadistica SET wins=wins+1 WHERE player_id=$1',[opp_id]);
        } else{
            await client.query('UPDATE private.estadistica SET draws=draws+1 WHERE player_id=$1',[decoded.id]);
            await client.query('UPDATE private.estadistica SET draws=draws+1 WHERE player_id=$1',[opp_id]);
        }
        res.send();
    } catch(err){
        console.log(err);
    } finally{
        client.end();
    }

});

app.get('/alreadyInMatch', async (req,res) =>{
    const decoded=  await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    const client= await newClient();
    await client.connect();

    try{
        const isHost=(await client.query(`SELECT code FROM private.lobbies where host_id=$1`,[decoded.id]) as any).rows[0] as any;
        const isOpp=(await client.query(`SELECT code FROM private.lobbies where opponent_id=$1`,[decoded.id]) as any).rows[0] as any;
        
        res.json({code :(isHost)? isHost?.code : isOpp?.code, rol : (isHost)? 'host' : 'opponent'});
    } catch (err){
        console.log(err)
        res.json();
    } finally{
        client.end();
    }
});

app.get('/getStats', async (req,res) =>{
    const decoded=  await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    const client= await newClient();
    await client.connect();

    try{
        res.json( (await client.query('SELECT wins,draws,losses FROM private.estadistica WHERE player_id=$1',[decoded.id]) as any).rows[0]);
    } catch (err){
        console.log(err);
    } finally{
        client.end();
    }


});

app.get( '/verifyUser' , async (req,res) =>{
    const decoded= await verifyTokenUser((req.headers.authorization as string).substring(7)) as any;
    res.json({name: decoded.name, id: decoded.id});
});

app.post( '/login' , async (req,res) =>{
    const client= await newClient();
    await client.connect();
    const x=await client.query(`SELECT private.players.name, password FROM private.players WHERE private.players.name=$1`,[req.body.name])
    const user=x.rows[0] as any;
    await client.end();

    if (user && await verifyPassword(req.body.pass,user.password)){
        res.json({token: await createTokenUser(user.name)});
    }
    res.status(403).json();
})


app.post( '/signup' , async (req,res) =>{
    const client= await newClient();
    client.connect();
    const name=req.body.name;
    const cryptoKey= await cryptoPassword(req.body.pass) as any;
    await client.query('INSERT INTO private.players (name,password) VALUES ($1,$2) ',[name, cryptoKey.toString('hex')]).then(async () =>{
        client.end();
        res.json({token: await createTokenUser(name)});
    }).catch((err) =>{
        client.end();
        res.status(409).json();
    });

});

app.get('/verifyCode', async (req,res) =>{
    const code=req.headers.code as string;
    const client= await newClient();
    await client.connect();

    try{
        res.json(await client.query('SELECT * FROM private.tablero WHERE private.tablero.code=$1',[code]));
    } catch (err){
        console.log(err)
    } finally{
        client.end();
    }
});



async function cryptoPassword(password: string){
    return new Promise((resolve,reject) => {
        crypto.pbkdf2(password,(process.env.CRYPTO_SALT as any),parseInt(process.env.CRYPTO_INTERATIONS as any),parseInt(process.env.CRYPTO_LENGTH as any),process.env.CRYPTO_DIGEST as any, (err,derivedKey) =>{
        if (err) reject(err);
        else{
            resolve(derivedKey);
        } 
    });
    });
}

async function verifyPassword(password: string,encPassword :string){
    const newPassword= await cryptoPassword(password) as any;
    try{
        return crypto.timingSafeEqual(Buffer.from(encPassword,'hex'),newPassword);
    } catch{
        return false;
    }
}

async function createTokenUser(name:string){
    const client= await newClient();
    await client.connect();
    const id= (await client.query('SELECT private.players.id FROM private.players WHERE private.players.name=$1',[name]) as any).rows[0].id;
    await client.end();
    return jsonwebtoken.sign({name: name, id:id}, (process.env.TOKEN_PRIVATE_KEY as any).replace(/\\n/g, '\n') as any, {algorithm: process.env.TOKEN_DIGEST as any});
}

async function verifyTokenUser(userToken:string){
    return new Promise( (resolve,reject) =>{
        jsonwebtoken.verify(userToken,(process.env.TOKEN_PRIVATE_KEY as string).replace(/\\n/g, '\n'), (err,decoded) =>{
        if (err) reject(false);
        else resolve(decoded);
    });
    });
}

