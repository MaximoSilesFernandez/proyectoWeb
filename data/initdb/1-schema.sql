


CREATE SCHEMA private;

CREATE TABLE private.players(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE private.tablero(
    code CHAR(5) PRIMARY KEY,
    c_1 VARCHAR(255) DEFAULT '"1":{"name":"empty","info":"","directions":"","team":""},',
    c_2 VARCHAR(255) DEFAULT '"2":{"name":"empty","info":"","directions":"","team":""},',
    c_3 VARCHAR(255) DEFAULT '"3":{"name":"empty","info":"","directions":"","team":""},',
    c_4 VARCHAR(255) DEFAULT '"4":{"name":"empty","info":"","directions":"","team":""},',
    c_5 VARCHAR(255) DEFAULT '"5":{"name":"empty","info":"","directions":"","team":""},',
    c_6 VARCHAR(255) DEFAULT '"6":{"name":"empty","info":"","directions":"","team":""},',
    c_7 VARCHAR(255) DEFAULT '"7":{"name":"empty","info":"","directions":"","team":""},',
    c_8 VARCHAR(255) DEFAULT '"8":{"name":"empty","info":"","directions":"","team":""},',
    c_9 VARCHAR(255) DEFAULT '"9":{"name":"empty","info":"","directions":"","team":""},',
    c_10 VARCHAR(255) DEFAULT '"10":{"name":"empty","info":"","directions":"","team":""},',
    c_11 VARCHAR(255) DEFAULT '"11":{"name":"empty","info":"","directions":"","team":""},',
    c_12 VARCHAR(255) DEFAULT '"12":{"name":"empty","info":"","directions":"","team":""},',
    c_13 VARCHAR(255) DEFAULT '"13":{"name":"empty","info":"","directions":"","team":""},',
    c_14 VARCHAR(255) DEFAULT '"14":{"name":"empty","info":"","directions":"","team":""},',
    c_15 VARCHAR(255) DEFAULT '"15":{"name":"empty","info":"","directions":"","team":""},',
    c_16 VARCHAR(255) DEFAULT '"16":{"name":"empty","info":"","directions":"","team":""},'
);

CREATE TABLE private.lobbies(
    code CHAR(5) PRIMARY KEY,
    host_id INTEGER NOT NULL REFERENCES private.players(id) UNIQUE,
    host_hand VARCHAR(255),
    opponent_id INTEGER REFERENCES private.players(id) UNIQUE,
    opponent_hand VARCHAR(255),
    turn INTEGER DEFAULT 1,
    map CHAR(5) REFERENCES private.tablero(code)
);




CREATE TABLE private.cartas(
    nombre VARCHAR(255) PRIMARY KEY,
    info CHAR(4) NOT NULL,
    directions VARCHAR(255)
);

CREATE TABLE private.estadistica(
    player_id INTEGER NOT NULL REFERENCES private.players(id),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    PRIMARY KEY (player_id)
);



CREATE FUNCTION addStatsTriger() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO private.estadistica(player_id) VALUES (NEW.id);
    RETURN NEW;
END; $$ 
LANGUAGE plpgsql;


CREATE TRIGGER addStatsTriger
AFTER INSERT ON private.players
FOR EACH ROW 
EXECUTE FUNCTION addStatsTriger();