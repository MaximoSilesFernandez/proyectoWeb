import { getCarta, getTablero, updateTablero, getWebSocket, getWebSocketEvent, verifyToken, createTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div>div") as NodeListOf<HTMLDivElement>;
const logs=document.querySelector('#logs') as HTMLDivElement;


let mapa= new Map<number,Carta>();
let baraja= [] as Carta[];
let place= [] as number[];


const codeInfoBattle=`<span class='resultado'><img src=''><img src=''></span>`

const carts= ['Bomb','Fang','Flan','Goblin','Ironite','Lizzard','Sahagin','Skeleton','Zaghnol','Zombie'] as string[];


const audioTakeOver=new Audio(`../src/assets/sounds/snd_bell.wav`);
const audioBattle=new Audio(`../src/assets/sounds/snd_badexplosion.wav`)
audioTakeOver.volume=0.2;
audioBattle.volume=0.2;
let currentTurn=1;
let yourTurn=false;

if (localStorage.getItem('currentTurn')) currentTurn=Number(localStorage.getItem('currentTurn'));

yourTurn=(localStorage.getItem('rol')==='host')? (currentTurn%2===1)? true : false : (currentTurn%2===0)? true : false;

if (localStorage.getItem('baraja')) await getHand();
else await createHand();

(document.querySelector('header>div') as HTMLDivElement).innerHTML=`Turno ${currentTurn}`;



const ws=await getWebSocket(localStorage.getItem('code') as string, ((await verifyToken(localStorage.getItem('token') as any) as any)?.name),localStorage.getItem('token') as string);
ws.addEventListener('message', async (mes)=>{
    const msg=JSON.parse(mes.data);

    if (msg.msg==='createTablero' && localStorage.getItem('rol')==='host'){
        (await createTablero(localStorage.getItem('code') as string,localStorage.getItem('token') as string)) as unknown as string
    } else if(msg.msg==='sendTablero'){

        const map=JSON.parse(msg.mapa) as JSON;
        

        for (let i = 1; i < 17; i++) {  
            mapa.set(i,Object.values(map)[i-1]) 
        }
        drawTablero(mapa);
        if (msg.newTurn){
            await updateTurn(msg.newTurn);
        }
        await everyDiv();
        
        console.log(yourTurn);
    } else if(msg.msg==='matchBegin'){
        ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));
        await coinAnimation(msg.first_turn);
        
    }
});

ws.addEventListener('open',() =>{
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, msg: 'getTablero'}));

    //ws.send(localStorage.getItem('code') as string);
});

ws.OPEN;

const wsEvent= await getWebSocketEvent(localStorage.getItem('token') as string);

async function updateTurn(newTurn:number){
    currentTurn=newTurn;
    localStorage.setItem('currentTurn',String(currentTurn));
    yourTurn=(localStorage.getItem('rol')==='host')? (currentTurn%2===1)? true : false : (currentTurn%2===0)? true : false;
}


wsEvent.addEventListener('message', async (mes) =>{

    const msg=JSON.parse(mes.data);

    console.log(msg.mapa);
    const map=JSON.parse(msg.mapa) as JSON;
        
    
    for (let i = 1; i < 17; i++) {  
        
        mapa.set(i,Object.values(map)[i-1]) 
    }
    drawTablero(mapa);
    await updateTurn(msg.turn);
    
    await waitaS(2);
    
    if (msg.attack.length==2){
        await animationTakeOver(msg.attack);

    } else{
        await animationBattle(msg.attack, msg.res_battle);

    }
    await waitaS(2);
    if (msg.combo.length!=0){
        await animationCombo(msg.combo,msg.attack[0]);
    }
    first_attack=[];
    combo_affected=[];
    resultado_battle=[];
    ws.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/), msg: 'updateTablero'}))
});

wsEvent.OPEN;

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


    baraja=await getCarta(localStorage.getItem('baraja')?.split(",") as string[],team) as Carta[];

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

    mapa.set(place[1],carta)

    let name_baraja=localStorage.getItem('baraja') as string;

    name_baraja=name_baraja.replace(baraja[place[0]+4].name,'');
    localStorage.setItem('baraja',name_baraja)
    drawTablero(mapa);
    getHand();
}


async function action(carta: Carta){
    
    const casilla_elected=mapa.get(place[1]) as Carta

    
    

    if (place[0]<1 && casilla_elected.name=="empty"){
        await placement(carta);
        await scan_attacks(carta,place[1]);
    } 
}


let first_attack=[] as number[];
let resultado_battle=[] as number[];
let combo_affected=[] as number[];

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
                console.log(carta_enemiga.name+" "+carta_enemiga.team)
                combo_affected.push(place_enemigo);
                logs.innerHTML+=`<ul>${carta.name} gana a ${carta_enemiga.name} por combo</ul>`;

            } else{
                pos_deff.push(place_enemigo);
                contraattacks.push(contraataque);
            }
        }
    }
    if (pos_deff.length>0 && !combo) await election_attack(carta,place[1],pos_deff,contraattacks);
    else if (!combo){

        ws.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/), msg: 'updateTablero', newTurn: ++currentTurn}))
    }

}


async function election_attack(attacker:Carta,place_attacker:number,listDeffendersPos:number[],listContraattack:String[]){
    var attackEventListener= async (event: Event) =>{
        const pos=Number((event.currentTarget as HTMLDivElement).id);

        await attack(attacker,place_attacker,pos,mapa.get(pos) as Carta,listContraattack[listDeffendersPos.indexOf(pos)] as string); 
        everyDiv(attackEventListener);
    };


    if (listDeffendersPos.length===1){
        await attack(attacker,place_attacker,listDeffendersPos[0],mapa.get(listDeffendersPos[0]) as Carta,listContraattack[0]);
    } 
    else{

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
        
        let first_attack_result=Math.random()*16+atk_power*16;
        let attack_result=first_attack_result-(Math.random()*first_attack_result+1);

        let first_defense_result=Math.random()*16+def_power*16;
        let defense_result=first_defense_result-(Math.random()*first_defense_result+1);

        
        if (attack_result>=defense_result){
            logs.innerHTML+=`<ul>${attacker.name} gana a ${deffender.name}</ul>`
            first_attack[0]=place_attacker;
            first_attack[1]=place_defender;
            const clon_deffender= {
                name: deffender.name,
                info: deffender.info,
                directions: deffender.directions,
                team : (deffender.team=='ally')? 'opp' : 'ally'
            }
            resultado_battle[0]=first_attack_result;
            resultado_battle[1]=attack_result;
            resultado_battle[2]=first_defense_result;
            resultado_battle[3]=defense_result;

            console.log(mapa)
            await scan_attacks(clon_deffender,place_defender,true);
            
        } else if (attack_result<defense_result){
            logs.innerHTML+=`<ul>${attacker.name} pierde contra ${deffender.name}</ul>`
            first_attack[0]=place_defender;
            first_attack[1]=place_attacker;

            resultado_battle[0]=first_defense_result;
            resultado_battle[1]=defense_result;
            resultado_battle[2]=first_attack_result;
            resultado_battle[3]=attack_result;
            
            const clon_attacker= {
                name: attacker.name,
                info: attacker.info,
                directions: attacker.directions,
                team : (attacker.team=='ally')? 'opp' : 'ally'
            }


            console.log(mapa)
            await scan_attacks(clon_attacker,place_attacker,true);
            
        } 
    } else{
        logs.innerHTML+=`<ul>${attacker.name} gana a ${deffender.name} por sorpresa</ul>`
        first_attack[0]=place_attacker;
        first_attack[1]=place_defender;
        
    }

    wsEvent.send(JSON.stringify({code: localStorage.getItem('code') as string, tablero: JSON.stringify(Object.fromEntries(mapa)), attack: first_attack, combo : combo_affected, res_battle: resultado_battle, turn: ++currentTurn }))
    
    
    
}


async function animationTakeOver(participans:number[]){
    const winner=mapa.get(participans[0]) as Carta;
    const loser=mapa.get(participans[1]) as Carta;
    loser.team=winner.team;

    drawTablero(mapa);
    await audioTakeOver.play();
}
async function animationBattle(participans:number[],res:number[]){
    const winner=mapa.get(participans[0]) as Carta;
    const loser=mapa.get(participans[1]) as Carta;

    tablero[participans[0]-4].innerHTML+=codeInfoBattle;
    tablero[participans[1]-4].innerHTML+=codeInfoBattle;
    let resultado=document.querySelectorAll('.resultado') as NodeListOf<HTMLSpanElement>;
    let countdown=true;
    let intervalo=(res[0]-res[1]>res[2]-res[3])? 2000/(res[0]-res[1]) : 2000/(res[2]-res[3]);

    await audioBattle.play();
    waitaS(2).then(() => {countdown=false;});

    do{
        if (res[0]>res[1]) res[0]--;
        if (res[2]>res[3]) res[2]--;
        await waitX(intervalo);
        numberBattle(resultado[0],res[0]);
        numberBattle(resultado[1],res[2]);

    }while(countdown);

    loser.team=winner.team;
    drawTablero(mapa);

}

async function numberBattle(span:HTMLSpanElement,n:number){
    span.children[0].setAttribute('src',`../src/assets/info/${Math.trunc(n/10)}.png`)
    span.children[1].setAttribute('src',`../src/assets/info/${n%10}.png`)
}
async function animationCombo(participans:number[],winner:number){
    const winner_team=(mapa.get(winner) as Carta).team as string;
    
    for (let i=0; i<participans.length; i++){
        const carta=mapa.get(participans[i]) as Carta;
        carta.team=winner_team;
        drawTablero(mapa);
        await audioTakeOver.play();
        await waitaS(2);

    }


    

}

async function animationCart(carta:Carta,pos:number){

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



const waitaS= (s:number) => new Promise(resolve => setTimeout(resolve,s*1000));
const waitX=(ms:number) => new Promise(resolve => setTimeout(resolve,ms));
