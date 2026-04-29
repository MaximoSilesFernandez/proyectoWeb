import { getCarta, getTablero, updateTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div>div");


let mapa_prueba= new Map<number,Carta>();
mapa_prueba.set(1,{name: "Bomb", info: "5M01", directions: "NW-E-S", team:"ally"});

let mapa= new Map<number,Carta>();

let place= [] as number[];

//mapa= await getTablero(localStorage.getItem("code") as string);
//drawTablero();
async function everyDiv(){
    tablero?.forEach(casilla =>{
    //console.log(casilla);
        casilla.addEventListener("click", (event) =>{
            const div=event.currentTarget as HTMLDivElement;
            if (place.length===0) place[0]= parseInt(div.id);
            else {
                if (place[0]===parseInt(div.id)){
                    place=[];
                } else{
                    place[1]= parseInt(div.id);
                    movement(mapa_prueba.get(place[0] ) as Carta);
                    place=[];
                }
            }
            console.log(`Casilla seleccionada ${div.id} `)
            div.children[0].setAttribute("src","../src/assets/vite.svg");
        });
    });
}

everyDiv();


document.addEventListener("click", (event) =>{
    console.log(event.target+"   "+event.currentTarget)
    if (event.target instanceof HTMLHtmlElement){
        tablero?.forEach(casilla =>{
            
            const div=casilla as HTMLDivElement;
            div.children[0].setAttribute("src","../src/assets/typescript.svg");
        });
    }
});



function drawTablero(mapa: Map<number,Carta>){
    for (let i=-5; i<22; i++){
        const casilla=(document.getElementById(`${i}`) as HTMLDivElement);
        const img=casilla.children[0] as HTMLImageElement;

        for (let j=1; j<=4; j++){
            (casilla.children[j] as HTMLImageElement).setAttribute("src",`../src/info/${mapa.get(i)?.info.charAt(j-1)}.png`);
            
        }
        img.setAttribute("src",`../src/Cartas/${mapa.get(i)?.name}${(mapa.get(i)?.team=='enemy')? '_opp' : ''}.png`); 
        
    }
}
await getCartas();
async function getCartas(){
    const cartas=["Bomb","Skeleton","Flan","Fang","Goblin"];
    const cartas_info=await getCarta(cartas);
    for (let i = 1; i <= cartas_info.length; i++) {

        const img=(document.getElementById(`${i}`) as HTMLDivElement).children[0] as HTMLImageElement;
        img.setAttribute("src",`../src/Cartas/yours/${cartas_info[i-1].name}.png`);
    }
}

async function movement(carta: Carta){
    mapa.set(place[1],carta);
    mapa.set(place[0],{name: 'unknown',info:'0000',directions:'',team: ''});
    updateTablero(localStorage.getItem("code") as string, mapa);
}