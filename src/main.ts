import {verifyCode} from "./api.ts";

const createLobyButton = document.getElementById("createLoby") as HTMLButtonElement;
const joinLobyButton = document.getElementById("joinLoby") as HTMLButtonElement;


createLobyButton.addEventListener("click",(event)=>{
    let code="";
    for(let i=0; i<5; i++){
        code+=String.fromCharCode(Math.random()*26+65);
    }
    console.log(code);
    localStorage.setItem("code",code);
    window.location.replace("/partida/?code="+code)
    

});

joinLobyButton.addEventListener("click",(event)=>{
    let div=(event.currentTarget as HTMLButtonElement).parentElement as HTMLDivElement;
    div.innerHTML=`<label for="code">Código:</label>
                   <input type="text" id="code" name="code"></input>
                   <button id="join">Join</button>`;
    document.getElementById("join")?.addEventListener("click",async (event)=>{
        const code=(document.getElementById("code") as HTMLInputElement)?.value as string
        if ( await verifyCode(code)) {
            localStorage.setItem("code", code )
            window.location.replace("/partida/?code="+code);
        } else {
            ((event.target as HTMLButtonElement).parentElement as HTMLDivElement).innerHTML+=`<p style="color:red">Código incorrecto</p>`;
        }
    });
});