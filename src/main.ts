
import {verifyCode, verifyToken,signup,login,determineRol,getStats, alreadyInMatch} from "./api.ts";

const createLobyButton = document.getElementById("createLoby") as HTMLButtonElement;
const joinLobyButton = document.getElementById("joinLoby") as HTMLButtonElement;
const loginButton=document.getElementById("loginButton") as HTMLButtonElement;
const signUpButton=document.getElementById("signUpButton") as HTMLButtonElement;

const divs=document.querySelectorAll("div") as NodeListOf<HTMLDivElement>;

async function changingDiv(){
    for (let i = 0; i < 5; i++) {
        divs[i].classList.toggle("hidden");
        
    }
}

localStorage.removeItem('baraja');
localStorage.removeItem('code');
localStorage.removeItem('yourTurn');
localStorage.removeItem('currentTurn');
localStorage.removeItem('rol');

if (localStorage.getItem('token')){
    divs[0].classList.add("hidden");
    divs[1].classList.add("hidden");
    await stats();
} else{
    divs[2].classList.add("hidden");
    divs[3].classList.add("hidden");
    divs[4].classList.add('hidden');
}

async function stats() {
    console.log("xd")
    const name= (await verifyToken(localStorage.getItem('token') as string)).name;
    const stats= await getStats(localStorage.getItem('token') as string);
    console.log(stats);
    divs[4].innerHTML=
    `<table>
        <tr>
            <th>${name}</th>
        </tr>
        <tr>
            <th style="color: green;">Wins</th>
            <th style="color: gray;">Draws</th>
            <th style="color: red;">Losses</th>
        </tr>
        <tr>
            <td>${stats.wins}</td>
            <td>${stats.draws}</td>
            <td>${stats.losses}</td>
        </tr>
    </table>`

}


loginButton.addEventListener("click", async ()=>{
    const name=(document.getElementById("name_login") as HTMLInputElement).value;
    const pass=(document.getElementById("pass_login") as HTMLInputElement).value;
    const token=await login(name,pass);
    localStorage.setItem("token",token.token);

    changingDiv();
    
});

signUpButton.addEventListener("click", async ()=>{
    const name=(document.getElementById("name_signup") as HTMLInputElement).value;
    const pass=(document.getElementById("pass_signup") as HTMLInputElement).value;
    const token=await signup(name,pass);
    localStorage.setItem("token",token.token);
    changingDiv();
});


createLobyButton.addEventListener("click", async (event)=>{
    const alreadyInMatchCode=await alreadyInMatch(localStorage.getItem('token') as string);
    console.log(alreadyInMatchCode);
    if (!alreadyInMatchCode.code){
        let code="";
        for(let i=0; i<5; i++){
            code+=String.fromCharCode(Math.random()*26+65);
        }
        console.log(code);
        localStorage.setItem("code",code);
        localStorage.setItem("rol",'host');
        window.location.replace("/partida/?code="+code)
    } else{
        (document.querySelector('body') as HTMLBodyElement).innerHTML=`<span>Lobby: ${alreadyInMatchCode.code}</span><button id='directJoin'>Join Match</button>`;
        document.getElementById('directJoin')?.addEventListener('click', async (event)=>{
            localStorage.setItem("code",alreadyInMatchCode.code);
            localStorage.setItem("rol",alreadyInMatchCode.rol);
            window.location.replace("/partida/?code="+alreadyInMatchCode.code);
        });
    }
    

});

joinLobyButton.addEventListener("click", async (event) =>{

    let div=(event.currentTarget as HTMLButtonElement).parentElement as HTMLDivElement;
    div.innerHTML=`<label for="code">Código:</label>
                <input type="text" id="code" name="code"></input>
                <button id="join">Join</button>`;
    document.getElementById("join")?.addEventListener("click",async (event)=>{
        const code=(document.getElementById("code") as HTMLInputElement)?.value as string
        const existe=await verifyCode(code);
        if (existe) {
            const alreadyInMatchCode=await alreadyInMatch(localStorage.getItem('token') as string);
            if (!alreadyInMatchCode.code){
                localStorage.setItem("code", code );
                const role= await determineRol(code,localStorage.getItem('token') as string);
                localStorage.setItem("rol",role);
                window.location.replace("/partida/?code="+code);
            } else{
                (document.querySelector('body') as HTMLBodyElement).innerHTML=`<span>Lobby: ${alreadyInMatchCode.code}</span><button id='directJoin'>Join Match</button>`;
                document.getElementById('directJoin')?.addEventListener('click', async (event)=>{
                    localStorage.setItem("code",alreadyInMatchCode.code);
                    localStorage.setItem("rol",alreadyInMatchCode.rol);
                    window.location.replace("/partida/?code="+alreadyInMatchCode.code);
                });
            }
        } else {
            ((event.target as HTMLButtonElement).parentElement as HTMLDivElement).innerHTML+=`<p style="color:red">Código incorrecto</p>`;
        }
    }); 
});

