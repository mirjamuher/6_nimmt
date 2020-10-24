// Global Variables
let players = [];
let periodicTimerID = 0;

// Functions called when page is loaded - DONE
function setupPage() {
    const gameID = document.body.getAttribute("data-game-id");
    const playerID = document.body.getAttribute("data-player-id");

    periodicTimerID = setInterval(function() { getGameInfo(gameID, playerID) }, 1000);
    // Alternative1: setInterval(() => getGameInfo(gameId), 1000);
    // Alternative2: setInterval(getGameInfo.bind(this, gameId), 1000);

    const elStartButton = document.querySelector("#startButton");

    elStartButton.addEventListener("click", function(event) {
        result = confirm(`Are you sure you want to start the game with ${players.length} players?`);

        if (result) {
            elStartButton.disabled = true;
            startGame(gameID);
        };
    });
}

async function getGameInfo(gameID, playerID) {
    const response = await fetch(`/api/game/${gameID}`);
    const jsonData = await response.json();

    const gameState = jsonData['state'];
    console.log("Game State is", gameState);
    if (gameState !== "waiting") {
        clearInterval(periodicTimerID); // Stops periodic fetching of game state
        location.assign(`/game/${gameID}/${playerID}`); // TODO: Make sure still accurate after serverside implementation
        return;
    };

    /*
    JSON
    {
        "id": game id,
        "players": [list of dicts with Player info],
        "state": game state string,
    }

    PLAYERS:
    {
        "player_name": str of player name
        "player_id": int of player id
        "player_no": int of player number
        "points": int of player points
        "avatar": filename of player avatar
    }
    */

    players = jsonData['players']; //overwrites global variable (top level)
    console.log("Please don't misuse this information, mkay?")
    console.log("The players are", players);

    generateTable(players)
}

function generateTable(players) {
    const numberOfPlayers = players.length

    let elTablePara = document.querySelector("#playerTable");
    elTablePara.innerHTML = '';

    let elTbl= document.createElement("table");

    let playerIndex = 0;
    for (let i=0; i!==Math.ceil(numberOfPlayers/2); i++) {
        const elRow = document.createElement("tr");

        for (let j=0; j<2; j++, playerIndex++) {
            const player =  players[playerIndex];
            const elCell = document.createElement("td");
            if (player !== undefined) {
                const playerName = player["player_name"];
                const playerAvatar = player["avatar"];

                const elAvatar = document.createElement("img");
                elAvatar.src = playerAvatar;
                elAvatar.width = "64";  // TODO: Temporary hack. Fix in CSS
                elAvatar.height = "64"; // TODO: Temporary hack. Fix in CSS
                elAvatar.classList.add("playerAvatar"); // For CSS styling

                const elName = document.createElement("span");
                elName.classList.add("playerName"); // For CSS styling
                elName.textContent = playerName;

                elCell.appendChild(elAvatar);
                elCell.appendChild(elName);
            }
            elRow.appendChild(elCell);
        }
        elTbl.appendChild(elRow);
    }
    elTablePara.appendChild(elTbl);
};

async function startGame(gameID) {

    const response = await fetch(`/api/game/${gameID}/start`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
    });

    if (!response.ok) {
        alert("Invalid room number. Please restart the game. Sorry");
    };
};

document.addEventListener("DOMContentLoaded", setupPage);
