


CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.players(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL;
);

CREATE TABLE private.lobbies(
    code CHAR(5) PRIMARY KEY,
    host_id INTEGER NOT NULL REFERENCES private.players(id) UNIQUE,
    opponent_id INTEGER REFERENCES private.players(id) UNIQUE,
    map VARCHAR(255) NOT NULL DEFAULT "";
);


CREATE TABLE private.cartas(
    name VARCHAR(255) PRIMARY KEY,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    directions VARCHAR(255);
)