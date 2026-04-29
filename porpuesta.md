# Propuesta del proyecto final

El proyecto tratara de recrear el juego de cartas Tetra Master, un subjuego de Final Fantasy 9. Con modalidad jugador contra jugador. 


#### Los requisitos son:

**Requisito 1** - Una página principal donde puedes conectar con tu cuenta y crear partido o unirte a una mediante un codigo.

**Requisito 2** - Cada jugador solo podra estar en una partida.

**Requisito 3** - La partida sera guardada por cada turno que pase.

**Requisito 4** - Al terminar la partida, esta es borrada.

**Requisito 5** - Si un tercer jugador entra, se le considerara espectador y solo podra visualizar lo ocurrido.

**Requisito 6** - Los jugadores tendran un historial de partidas donde saldra los resultados de estas.


#### Arquitectura

El cliente y el backend su codigo sera typescript, usando node js en el backend. 

###### Librerias de node js:
    1- Express: Para usar get y post de fetch y comunicarnos con el client.
    2- Jsonwebtoken: Para usos de token con usuarios y encriptación.
    3- Crypto: Para encriptación relacionado con la base de datos.
    4- pg: Para conectarse a la base de datos y hacer querys.
    5- dotenv: Para el uso.
    6- Vite: Para poder ver la página web.