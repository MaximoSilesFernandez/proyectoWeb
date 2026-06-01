

const server = import.meta.env.VITE_BACKEND_URL;





console.log(server)

export interface Carta {
    name: string,
    info: string,
    directions: string,
    team: string;
}

export async function login(name : string, pass : string) {
  const response = await fetch(`${server}/login`, {
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
  const response = await fetch(`${server}/signup`, {
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
  const response=await fetch(`${server}/verifyUser`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
  if (response.status === 498) {
    throw new Error("Invalid Token");
  }

  return await response.json();

}


export async function verifyCode(code:string){

    const res=await fetch(`${server}/verifyCode`,{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "code":  code
        }
    });

    return (res)? true : false;
}




export async function updateTablero(code:string,tablero:Map<number,Carta>){
    await fetch(`${server}/updateMap`,{
        method: "POST",
        headers:{
            "Content-Type": "application/json",
            
        },
        body: JSON.stringify({code: code, tablero: tablero})
    });
}

export async function getTablero(code:string){
    const res=await fetch(`${server}/getMap`,{
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

    await fetch(`${server}/newMatch`,{
        method: "POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({code: code, mapa: JSON.stringify(Object.fromEntries(mapa)).split(/(?<=},)/)})
    }).catch((err) =>{console.log(err)}) 

}

export async function updateStats(token:string, result:string, code:string){
    await fetch(`${server}/updateStats`,{
        method: 'POST',
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({result : result, code : code})
        
    });
}


export async function getCarta(cartas:string[], team:string){
    const res=await fetch(`${server}/getCarta`,{
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
    const res=await fetch(`${server}/determineRol`,{
        method: "GET",
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`,
            "code": code
        },
    });

    return await res.json();

}

export async function getStats(token:string){
    console.log(token)
    const res=await fetch(`${server}/getStats`,{
        method: 'GET',
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    return await res.json();
}

export async function alreadyInMatch(token:string){
    const res=await fetch(`${server}/alreadyInMatch`,{
        method: 'GET',
        headers:{
            "Content-Type":"application/json",
            "Authorization": `Bearer ${token}`
        }
    });


    return await res.json();
}