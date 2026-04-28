import  {getTablero} from "./api.ts";
import type {Carta} from "./api.ts";
const tablero= document.querySelector("main")?.querySelectorAll("div");


let mapa= new Map<number,Carta>();

mapa= await getTablero(localStorage.getItem("code") as string);
drawTablero();
tablero?.forEach(casilla =>{
    //console.log(casilla);
    casilla.addEventListener("click", (event) =>{
    
        const div=event.currentTarget as HTMLDivElement;
        console.log(`Casilla seleccionada ${div.id} `)
        div.children[0].setAttribute("src","../src/assets/vite.svg");
    })
});

function drawTablero(){
    mapa?.forEach((carta, key) =>{
        console.log(`Carta n ${key} con nombre ${carta.name}`);
    });
}

