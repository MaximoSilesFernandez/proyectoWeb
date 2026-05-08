
export interface Carta {
    name: string,
    info: string,
    directions: string,
    team: string;
}

export async function login(name : string, pass : string) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, pass }),
  });

  if (response.status === 403) {
    throw new Error("Incorrect email or password");
  }

  return await response.json();
}

export async function signup(name: string, pass: string) {
  const response = await fetch("http://localhost:3000/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, pass }),
  });

  if (response.status === 409) {
    throw new Error("A user already exists with this email");
  }
  return await response.json();
}

export async function verifyToken(token: string){
  const response=await fetch("http://localhost:3000/verifyUser", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  return await response.json();

}


export async function verifyCode(code:string){
    console.log("a")
    const res=await fetch(`http://localhost:3000/verifyCode`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "code":  code
        }
    }).catch(err =>{
        console.log(err)
    })
    console.log(res);
    return (res)? true : false;
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

export async function createTablero(code:string,token:string){
    let x=0;
    const mapa=new Map<Number,Carta>();

    for (let i = 1; i < 17; i++) {
        if (x<3){
            if (Math.random()*100<20){
                mapa.set(i,{name: 'blocked',info:'',directions:'',team: ''})
                x++;
                continue;
            }     
        } 
        mapa.set(i,{name: 'empty',info:'',directions:'',team: ''})            
    } 

    await fetch(`http://localhost:3000/newMatch`,{
        method: "POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({code: code, mapa: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/)})
    }).catch((err) =>{console.log(err)}) 

}



export async function getCarta(cartas:string[], team:string){
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
        carts.push({name: carta.nombre, info: carta.info, directions: carta.directions, team: team});
    }
    return carts;
}


export async function getWebSocket(code:string, user:string,token:string){
    return new WebSocket(`ws://localhost:3000/match?room=${code}&user=${user}&token=${token}`)
}

export async function getWebSocketEvent(token:string){
    return new WebSocket(`ws://localhost:3000/events?token=${token}`);
}



export async function determineRol(code:string, token:string){
    const res=await fetch(`http://localhost:3000/determineRol`,{
        method: "GET",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`,
            "code": code
        },
    });

    return await res.json();

}