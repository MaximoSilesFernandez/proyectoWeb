import { getCarta, getTablero, updateTablero, getWebSocket, getWebSocketEvent, verifyToken, createTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div>div") as NodeListOf<HTMLDivElement>;
const logs=document.querySelector('#logs') as HTMLDivElement;


let mapa= new Map<number,Carta>();
let baraja= [] as Carta[];
let place= [] as number[];

const carts= ['Bomb','Fang','Flan','Goblin','Ironite','Lizzard','Sahagin','Skeleton','Zaghnol','Zombie'] as string[];

let currentTurn=1;
let yourTurn=false;

if (localStorage.getItem('currentTurn')) currentTurn=Number(localStorage.getItem('currentTurn'));
if (localStorage.getItem('yourTurn')){
    yourTurn= (localStorage.getItem('yourTurn')=='true')? true : false;
    console.log(yourTurn)
} 
if (localStorage.getItem('baraja')) await getHand();
else await createHand();

(document.querySelector('header>div') as HTMLDivElement).innerHTML=`Turno ${currentTurn}`;



const ws=await getWebSocket(localStorage.getItem('code') as string, ((await verifyToken(localStorage.getItem('token') as any) as any)?.name),localStorage.getItem('token') as string);
ws.addEventListener('message', async (mes)=>{
    const msg=JSON.parse(mes.data);
    console.log(mes)
    if (msg.msg==='createTablero' && localStorage.getItem('rol')==='host'){
        (await createTablero(localStorage.getItem('code') as string,localStorage.getItem('token') as string)) as unknown as string
    } else if(msg.msg==='sendTablero'){
        //console.log(msg.mapa);
        const map=JSON.parse(msg.mapa) as JSON;
        
        //console.log(map)
        for (let i = 1; i < 17; i++) {  
            mapa.set(i,Object.values(map)[i-1]) 
        }
        drawTablero(mapa);
        if (msg.newTurn){
            logs.innerHTML+=`<ul>------Turno ${currentTurn}------</ul>`;
            currentTurn++;
            localStorage.setItem('currentTurn',String(currentTurn));
            yourTurn= (yourTurn)? false : true;
            localStorage.setItem('yourTurn',String(yourTurn));
        } 
        await everyDiv();
        console.log(yourTurn)
    } else if(msg.msg==='matchBegin'){
        ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));
        await coinAnimation(msg.first_turn);
        console.log(yourTurn);
    }
});

ws.addEventListener('open',() =>{
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));
    console.log("WebSocket abierto")
    //ws.send(localStorage.getItem('code') as string);
});

ws.OPEN;

const wsEvent= await getWebSocketEvent();

wsEvent.addEventListener('message', async (mes) =>{
    const msg=JSON.parse(mes.data);

    if (msg.attack.length==1){
        await animationTakeOver(msg.attack);
    } else{
        await animationBattle(msg.attack);
    }

    if (msg.combo.length!=0){
        await animationCombo(msg.combo);
    }

});

async function createHand(){
    let hand=[] as string[]
    for (let i=0;i<5;i++){
        hand.push(carts[Math.trunc(Math.random()*10)]);
    }
    localStorage.setItem('baraja',hand.join(','));
    getHand()
}



async function getHand() {
    const team=(localStorage.getItem('rol')==='host')? 'ally' : 'opp';
    console.log(team);

    baraja=await getCarta(localStorage.getItem('baraja')?.split(",") as string[],team) as Carta[];
    console.log(baraja)
}


async function everyDiv(funcion: Function = ()=>{}){
    tablero?.forEach(async casilla =>{
        casilla.removeEventListener('click',everyDivEventListener);
        casilla.removeEventListener('click',funcion as any);
        casilla.addEventListener("click", everyDivEventListener);  
    });
}

async function everyDivEventListener(event: Event){
    const div=event.currentTarget as HTMLDivElement;
    if (yourTurn){
        console.log("a");
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
    } else{
        place=[];
    }

}





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
        else{
            let limit;

            limit=( yourTurn)? 5-Math.trunc(currentTurn/2) : 6-currentTurn/2;
            console.log(limit)
           

            if (i<=(limit+16)){
                url=`url(../src/assets/Cartas/unknown.png)`;
            } else{
                url=``;
            }
                
            
        }  

        casilla.style.backgroundImage=url;

        
    }
}


//await getCartas();


async function placement(carta: Carta){
    console.log(mapa);
    mapa.set(place[1],carta)
    console.log(mapa);
    let name_baraja=localStorage.getItem('baraja') as string;
    console.log(baraja[place[0]+4].name)
    name_baraja=name_baraja.replace(baraja[place[0]+4].name,'');
    localStorage.setItem('baraja',name_baraja)
    drawTablero(mapa);
    getHand();
    //updateTablero(localStorage.getItem("code") as string, mapa);
}


async function action(carta: Carta){
    
    const casilla_elected=mapa.get(place[1]) as Carta

    
    

    if (place[0]<1 && casilla_elected.name=="empty"){
        await placement(carta);
        await scan_attacks(carta,place[1]);
    } }


async function scan_attacks(carta: Carta,position:number, combo:boolean = false){
    const borde_izq=[1,5,9,13] as number[];
    const borde_der=[4,8,12,16] as number[];
    const pos=carta.directions.split("-") as String[];
    console.log(carta.name+" escanea de equipo "+carta.team)

    let pos_deff=[] as number[];
    let contraattacks= [] as String[];

    for (const attk of pos) {
        let carta_enemiga;
        let place_enemigo;
        switch (attk){
            case 'NW':
                carta_enemiga=(mapa.get(position-5) as Carta);
                place_enemigo=position-5;
                break;
            case 'N':
                carta_enemiga=(mapa.get(position-4) as Carta);
                place_enemigo=position-4;
                break;
            case 'NE':
                carta_enemiga=(mapa.get(position-3) as Carta);
                place_enemigo=position-3;
                break;
            case 'W':
                carta_enemiga=(mapa.get(position-1) as Carta);
                place_enemigo=position-1;
                break;
            case 'E':
                carta_enemiga=(mapa.get(position+1) as Carta);
                place_enemigo=position+1;
                break;
            case 'SW':
                carta_enemiga=(mapa.get(position+3) as Carta);
                place_enemigo=position+3;
                break;
            case 'S':
                carta_enemiga=(mapa.get(position+4) as Carta);
                place_enemigo=position+4;
                break;
            case 'SE':
                carta_enemiga=(mapa.get(position+5) as Carta);
                place_enemigo=position+5;
                break;
            default:
                carta_enemiga={name: 'empty',info:'',directions:'',team: ''};
                place_enemigo=0;
                break;
                                    
        }
        if (!carta_enemiga) continue;
        console.log(carta)
        console.log(carta_enemiga.name)
        const condition_1=(carta_enemiga.name!='empty' && carta_enemiga.team!=carta.team && carta_enemiga.name!='blocked');
        let contraataque='';

        if (attk==='NW' && condition_1 && !borde_izq.includes(position)  && position>4){
            contraataque='SE';
        } else if(attk==='N' && condition_1 && position>4){
            contraataque='S';
        } else if( attk==='NE' && condition_1 && !borde_der.includes(position ) && position>4){
            contraataque='SW';
        } else if( attk==='W' && condition_1 && !borde_izq.includes(position)){
            contraataque='E';
        } else if( attk==='E' && condition_1 && !borde_der.includes(position)){
            contraataque='W';
        } else if(attk==='SW' && condition_1 && !borde_izq.includes(position) && position<13){
            contraataque='NE';
        } else if(attk==='S' && condition_1 && position<13){
            contraataque='N';
        } else if( attk==='SE' && condition_1 && !borde_der.includes(position) && position<13){
            contraataque='NW';
        }

        if (contraataque!==''){
            if (combo){
                logs.innerHTML+=`<ul>${carta.name} gana a ${carta_enemiga.name} por combo</ul>`;
                carta_enemiga.team=carta.team;
                mapa.set(place_enemigo,carta_enemiga);
            } else{
                pos_deff.push(place_enemigo);
                contraattacks.push(contraataque);
            }
        }
    }
    if (pos_deff.length>0 && !combo) await election_attack(carta,place[1],pos_deff,contraattacks);
    else if (!combo){

        ws.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/), msg: 'updateTablero'}))
    }

}


async function election_attack(attacker:Carta,place_attacker:number,listDeffendersPos:number[],listContraattack:String[]){
    var attackEventListener= async (event: Event) =>{
        const pos=Number((event.currentTarget as HTMLDivElement).id);
        await attack(attacker,place_attacker,pos,mapa.get(pos) as Carta,listContraattack[listDeffendersPos.indexOf(pos)] as string); 
        everyDiv(attackEventListener);
    };
    if (listDeffendersPos.length===1) await attack(attacker,place_attacker,listDeffendersPos[0],mapa.get(listDeffendersPos[0]) as Carta,listContraattack[0]);
    else{
        console.log("Añadiendo evets");
        for( const pos of listDeffendersPos){
            document.getElementById(`${pos}`)?.addEventListener('click', attackEventListener,{once:true});
        }
    }
        
    

}






async function attack(attacker:Carta,place_attacker:number,place_defender:number,deffender:Carta,contrattack:String){
    logs.innerHTML+=`<ul>${attacker.name} ataca a ${deffender.name}</ul>`;
    console.log(`${attacker.name} ataca a ${deffender.name}`)
    const opp_attk=deffender.directions.split('-') as String[];
    
    if (opp_attk.includes(contrattack)){

        const atk_power=Number(attacker.info.charAt(0));
        let def_info=(attacker.info.charAt(1)=='P')? deffender.info.charAt(2) : deffender.info.charAt(3);
        const def_power=('ABCDEF'.includes(def_info))? (10+'ABCDEF'.indexOf(def_info)) : Number(def_info) ;
        let attack_result;
        attack_result=Math.random()*16+atk_power*16;
        console.log(attack_result)
        attack_result-=Math.random()*attack_result+1;
        console.log(attack_result)
        let defense_result;
        defense_result=Math.random()*16+def_power*16;
        console.log(defense_result)
        defense_result-=Math.random()*defense_result+1;
        console.log(defense_result)

        if (attack_result>=defense_result){
            logs.innerHTML+=`<ul>${attacker.name} gana a ${deffender.name}</ul>`
            deffender.team=attacker.team;
            mapa.set(place_defender,deffender);
            console.log(mapa)
            
            await scan_attacks(deffender,place_defender,true);
    
        } else if (attack_result<defense_result){
            logs.innerHTML+=`<ul>${attacker.name} pierde contra ${deffender.name}</ul>`
            attacker.team=deffender.team;
            mapa.set(place_attacker,attacker);
            console.log(mapa)
            await scan_attacks(attacker,place_attacker,true);
    
        } 
    } else{
        logs.innerHTML+=`<ul>${attacker.name} gana a ${deffender.name} por sorpresa</ul>`
        deffender.team=attacker.team;
        mapa.set(place_defender,deffender);

    }
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/), msg: 'updateTablero'}))


    
}




async function coinAnimation(who : string){
    if (who=='host'){
        console.log('Supuesta animacion pro-host')
    } else if(who=='opponent'){
        console.log('Supuesta animacion pro-opp')
    }
    const interpole=(localStorage.getItem('rol')==who)? 'true' : 'false';
    localStorage.setItem('yourTurn',interpole);
}
