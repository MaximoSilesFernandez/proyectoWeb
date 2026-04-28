
export interface Carta {
    name: string,
    hp: number,
    atk: number,
    def: number,
    directions: string;
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
            "code": code
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