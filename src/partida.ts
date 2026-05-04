import { getCarta, getTablero, updateTablero, getWebSocket, verifyToken, createTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div>div");



let mapa= new Map<number,Carta>();
let baraja= [] as Carta[];

let place= [] as number[];

const carts= ['Bomb','Fang','Flan','Goblin','Ironite','Lizzard','Sahagin','Skeleton','Zaghnol','Zombie'] as string[];




const ws=await getWebSocket(localStorage.getItem('code') as string, ((await verifyToken(localStorage.getItem('token') as any) as any)?.name),localStorage.getItem('token') as string);
ws.addEventListener('message', async (mes)=>{
    const msg=JSON.parse(mes.data);
    console.log(mes)
    if (msg.msg==='createTablero' && localStorage.getItem('rol')==='host'){
        await createTablero(localStorage.getItem('code') as string,localStorage.getItem('token') as string)
        await createHand();
        ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));
    } else if(msg.msg==='sendTablero'){
        console.log(msg.mapa);
        const map=JSON.parse(msg.mapa) as JSON;

        console.log(map)
        for (let i = 1; i < 17; i++) {  
            mapa.set(i,Object.values(map)[i-1]) 
        }
        drawTablero(mapa);
    }
    console.log(msg);
});

ws.addEventListener('open',() =>{
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));
    //ws.send(localStorage.getItem('code') as string);
});

ws.OPEN;


async function createHand(){
    let hand=[] as string[]
    for (let i=0;i<5;i++){
        hand.push(carts[Math.trunc(Math.random()*10)]);
    }
    localStorage.setItem('baraja',hand.join(','));
    getHand()
}

if (localStorage.getItem('baraja')) await getHand();
else await createHand();

async function getHand() {
    const team=(localStorage.getItem('rol')==='host')? 'ally' : 'opp';
    console.log(team);

    baraja=await getCarta(localStorage.getItem('baraja')?.split(",") as string[],team) as Carta[];
    console.log(baraja)
}


async function everyDiv(){
    tablero?.forEach(casilla =>{
        casilla.addEventListener("click", async (event) =>{
            const div=event.currentTarget as HTMLDivElement;
            if (place.length===0) place[0]=parseInt(div.id);
            else {
                if (place[0]===parseInt(div.id)){
                    place=[];
                } else if (0< parseInt(div.id) && parseInt(div.id)<17){
                    place[1]= parseInt(div.id);

                    await action(((0<place[0])? mapa.get(place[0]): baraja[4+place[0]] ) as Carta);
                    place=[];
                }
            }
        });
    });
}

everyDiv();


document.addEventListener("click", (event) =>{
    
    if (event.target instanceof HTMLHtmlElement){
        tablero?.forEach(casilla =>{
            
            const div=casilla as HTMLDivElement;
            //div.children[0].setAttribute("src","../src/assets/typescript.svg");
        });
    }
});



function drawTablero(mapa: Map<number,Carta>){


    

    for (let i=-4; i<22; i++){

        const casilla=(document.getElementById(`${i}`) as HTMLDivElement);
        const info= (0<i && i<17)? mapa.get(i)?.info as string || "" : (i<1)? baraja[4+i]?.info || "": "";
        //console.log(info)
        if (!info){
            for (let j=0; j <4; j++){
                (casilla.children[j] as HTMLImageElement).style.visibility="hidden";
            }
        } 
        for (let j=0; j<info.length; j++){
            (casilla.children[j] as HTMLImageElement).style.visibility="visible";
            (casilla.children[j] as HTMLImageElement).setAttribute("src",`../src/assets/info/${info.charAt(j)}.png`);
            
        }
        let url : string;
        if (0<i && i<17) url=`url(../src/assets/Cartas/${mapa.get(i)?.name}${(mapa.get(i)?.team=='opp')? '_opp' : ''}.png)`; 
        else if (i<1)   url=`url(../src/assets/Cartas/${baraja[4+i]?.name}${(baraja[4+i]?.team=='opp')? '_opp' : ''}.png)`; 
        else  url=`url(../src/assets/Cartas/unknown.png)`;

        casilla.style.backgroundImage=url;

        
    }
}


//await getCartas();


async function placement(carta: Carta){
    console.log(mapa);
    mapa.set(place[1],carta)
    console.log(mapa);
    //mapa.set(place[0],{name: 'blocked',info:'',directions:'',team: ''});
    drawTablero(mapa);
    //updateTablero(localStorage.getItem("code") as string, mapa);
}


async function action(carta: Carta){
    
    const casilla_elected=mapa.get(place[1]) as Carta

    
    

    if (place[0]<1 && casilla_elected.name=="empty"){
        await placement(carta);
        await scan_attacks(carta);
    } 
}


async function scan_attacks(carta: Carta){
    const borde_izq=[1,5,9,13] as number[];
    const borde_der=[4,8,12,16] as number[];
    const pos=carta.directions.split("-") as String[];
    
    for (const attk of pos) {
        let carta_enemiga;
        switch (attk){
            case 'NW':
                carta_enemiga=(mapa.get(place[1]-5) as Carta);
                break;
            case 'N':
                carta_enemiga=(mapa.get(place[1]-4) as Carta);
                break;
            case 'NE':
                    carta_enemiga=(mapa.get(place[1]-3) as Carta);
                break;
            case 'W':
                carta_enemiga=(mapa.get(place[1]-1) as Carta);
                break;
            case 'E':
                carta_enemiga=(mapa.get(place[1]+1) as Carta);
                break;
            case 'SW':
                carta_enemiga=(mapa.get(place[1]+3) as Carta);
                break;
            case 'S':
                carta_enemiga=(mapa.get(place[1]+4) as Carta);
                break;
            case 'SE':
                carta_enemiga=(mapa.get(place[1]+5) as Carta);
                break;
            default:
                carta_enemiga={name: 'empty',info:'',directions:'',team: ''};
                break;
                                    
        }
        if (!carta_enemiga) continue;
        const condition_1=(carta_enemiga.name!='empty' && carta_enemiga.name!='blocked');
                                
        if (attk==='NW' && condition_1 && !borde_izq.includes(place[1])  && place[1]>4){
            await attack(carta,carta_enemiga,'SE');
        } else if(attk==='N' && condition_1 && place[1]>4){
            await attack(carta,carta_enemiga,'S');
        } else if( attk==='NE' && condition_1 && !borde_der.includes(place[1] ) && place[1]>4){
            await attack(carta,carta_enemiga,'SW');
        } else if( attk==='W' && condition_1 && !borde_izq.includes(place[1])){
            await attack(carta,carta_enemiga,'E');
        } else if( attk==='E' && condition_1 && !borde_der.includes(place[1])){
            await attack(carta,carta_enemiga,'W');
        } else if(attk==='SW' && condition_1 && !borde_izq.includes(place[1]) && place[1]<13){
            await attack(carta,carta_enemiga,'NE');
        } else if(attk==='S' && condition_1 && place[1]<13){
            await attack(carta,carta_enemiga,'N');
        } else if( attk==='SE' && condition_1 && !borde_der.includes(place[1]) && place[1]<13){
            await attack(carta,carta_enemiga,'NW');
        }
    }
    console.log("!MAPA ")
    console.log(mapa)
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/), msg: 'updateTablero'}))
}

async function attack(attacker:Carta,deffender:Carta,contrattack:String){
    console.log(`${attacker.name} ataca a ${deffender.name}`)
    const opp_attk=deffender.directions.split('-') as String[];
    
    if (opp_attk.includes(contrattack)){
        await attack(deffender,attacker,'none');
    }
    
    
}



