
export interface Carta {
    name: string,
    info: string,
    directions: string,
    team: string;
}




export async function verifyCode(code:string){

    const res=await fetch(`http://localhost:3000/verifyCode`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "code": code
        }
    });
    return res.status===200;
}

export async function updateTablero(code:string,tablero:Map<number,Carta>){
    await fetch(`http://localhost:3000/updateMap`,{
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            
        },
        body: JSON.stringify({code: code, tablero: tablero})
    });
}

export async function getTablero(code:string){
    const res=await fetch(`http://localhost:3000/getMap`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "code": code as string
        }
    });
    return await res.json() as Map<number,Carta>;
    
}

export async function createTablero(code:string){
    await fetch(`http://localhost:3000/createMap`,{
        method: "POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({code: code})
    })
}

export async function getCarta(cartas:string[]){
    const res=await fetch(`http://localhost:3000/getCarta`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "cartas":  cartas.join(",") as string
        }
    })
    const data=await res.json() as any[];
    const carts= [] as Carta[];
    for (const carta of data){
        carts.push({name: carta.nombre, info: carta.info, directions: carta.directions, team: 'ally'});
    }
    return carts;
}
const socket = new WebSocket('ws://localhost:3000/match?room=1234')

socket.addEventListener('message', (res) =>{
    console.log(res)
})
