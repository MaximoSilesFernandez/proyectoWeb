


CREATE SCHEMA private;

CREATE TABLE private.players(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE private.lobbies(
    code CHAR(5) PRIMARY KEY,
    host_id INTEGER NOT NULL REFERENCES private.players(id) UNIQUE,
    opponent_id INTEGER REFERENCES private.players(id) UNIQUE,
    map VARCHAR(255)
);


CREATE TABLE private.cartas(
    nombre VARCHAR(255) PRIMARY KEY,
    info CHAR(4) NOT NULL,
    directions VARCHAR(255),
    team VARCHAR(255)
);

/*
CREATE TABLE private.game_state(
    lobby_code CHAR(5) PRIMARY KEY REFERENCES private.lobbies(code),
    player1_hand VARCHAR(255) NOT NULL,
    player2_hand VARCHAR(255) NOT NULL,
    board VARCHAR(255) NOT NULL,
    turn INTEGER NOT NULL
)*/