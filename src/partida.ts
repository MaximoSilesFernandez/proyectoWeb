import { getCarta, getTablero, updateTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div>div");



let mapa= new Map<number,Carta>();

let place= [] as number[];

//mapa= await getTablero(localStorage.getItem("code") as string);
//drawTablero();
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
                    await action(mapa.get(place[0] ) as Carta);
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
        const info= mapa.get(i)?.info as string || "";

        if (!info){
            for (let j=0; j <4; j++){
                (casilla.children[j] as HTMLImageElement).style.visibility="hidden";
            }
        } 
        for (let j=0; j<info.length; j++){
            (casilla.children[j] as HTMLImageElement).style.visibility="visible";
            (casilla.children[j] as HTMLImageElement).setAttribute("src",`../src/assets/info/${info.charAt(j)}.png`);
            
        }
        casilla.style.backgroundImage=`url(../src/assets/Cartas/${mapa.get(i)?.name}${(mapa.get(i)?.team=='enemy')? '_opp' : ''}.png)`; 
        
    }
}
await getCartas();
async function getCartas(){
    const cartas=["Bomb","Skeleton","Flan","Fang","Goblin"];
    const cartas_info=await getCarta(cartas);

    let x=0;

    for (let i = -4; i < 22; i++) {
        if (i<1) mapa.set(i,cartas_info[i+4])
        else if(i<17){
            if (x<3){
                if (Math.random()*100<20){
                    mapa.set(i,{name: 'blocked',info:'',directions:'',team: ''})
                    x++;
                    continue;
                } 
                
            } 

            mapa.set(i,{name: 'empty',info:'',directions:'',team: ''})
            
            
        } else{
            console.log(i)
            mapa.set(i,{name: 'unknown',info:'',directions:'',team: ''})
        }
    }
    drawTablero(mapa)
}

async function placement(carta: Carta){
    
    mapa.set(place[1],carta);
    mapa.set(place[0],{name: 'blocked',info:'',directions:'',team: ''});
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


async function scan_attacks(carta: Carta,){
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
}

async function attack(attacker:Carta,deffender:Carta,contrattack:String){
    console.log(`${attacker.name} ataca a ${deffender.name}`)
    const opp_attk=deffender.directions.split('-') as String[];
    
    if (opp_attk.includes(contrattack)){
        await attack(deffender,attacker,'none');
    }

    
}