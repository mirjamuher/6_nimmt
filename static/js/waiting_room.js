// Global Variables
let players = [];
let periodicTimerID = 0;

// Functions called when page is loaded - DONE
function setupPage() {
    const gameID = document.body.getAttribute("data-game-id");
    const playerID = document.body.getAttribute("data-player-id");

    periodicTimerID = setTimeout(function() {getGameInfo(gameID, playerID)}, 0);

    const elStartButton = document.querySelector("#startButton");

    elStartButton.addEventListener("click", function(event) {
        result = confirm(`Are you sure you want to start the game with ${players.length} players?`);

        if (result) {
            elStartButton.disabled = true;
            activateStartGameLogic(gameID);
        };
    });
}

async function getGameInfo(gameID, playerID) {
    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Is the game ID correct?");
        return;
    }
    const jsonData = await response.json();

    const gameState = jsonData['state'];
    console.log("Game State is", gameState);
    if (gameState !== "waiting") {
        location.assign(`/game/${gameID}/${playerID}`);
        return;
    };

    /* INFORMATION CONTAINED IN API CALL
    JSON
    {
        "id": game id,
        "players": info listed below under players,
        "n_players": number of players in the game,
        "max_players": max amount of players (set to 10),
        "state": game state string,
        "stacks": [[Card, Optional[Card],...][-"-][-"-][-"-]],
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

    // Generates table with the information garnered
    generateTable(players);

    // Updates Info on how many players can still join
    const nPlayers = parseInt(jsonData['n_players'], 10);
    const maxPlayers = parseInt(jsonData['max_players']);
    const playersLeft = maxPlayers - nPlayers;
    const elPlayerLeftInfoParent = document.querySelector("#remainingPlayersParent");
    const elPlayersLeftInfo = document.querySelector("#remainingPlayers");
    elPlayersLeftInfo.textContent = playersLeft;
    elPlayerLeftInfoParent.classList.remove("hidden");

    periodicTimerID = setTimeout(function() {getGameInfo(gameID, playerID)}, 1000*3);
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

async function activateStartGameLogic(gameID) {
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

/* RANDOM BITS LEARNED
    periodicTimerID = setInterval(function() { getGameInfo(gameID, playerID) }, 1000);
    Alternative1: setInterval(() => getGameInfo(gameId), 1000);
    Alternative2: setInterval(getGameInfo.bind(this, gameId), 1000);
*/
