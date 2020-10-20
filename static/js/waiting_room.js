function setupPage() {
    const gameId = document.body.getAttribute("data-game-id");

    setInterval(function() { getGameInfo(gameId) }, 1000);
    // Alternative1: setInterval(() => getGameInfo(gameId), 1000);
    // Alternative2: setInterval(getGameInfo.bind(this, gameId), 1000);
}

async function getGameInfo(game_id) {
    const response = await fetch(`/api/game/${game_id}`);
    const jsonData = await response.json();

    const gameState = jsonData['state'];
    console.log("Game State is", gameState);
    if (gameState !== "waiting") {
        // TODO: redirect
        return;
    };

    const players = jsonData['players'];
    console.log("The players are", players);

    generateTable(players)

    // NEXT STEPS:
    // 1) Fill table with active player avatar + info
    // 4) implement redirect (TODO above)
    // ...
    // x) make game start button work

}

function generateTable(players) {

    const numberOfPlayers = players.length


    let elTablePara = document.querySelector("#playerTable");
    elTablePara.innerHTML = '';

    let elTbl= document.createElement("table");

    for (let i=0; i!==Math.ceil(numberOfPlayers/2); i++) {
        let elRow = document.createElement("tr");

        for(let j=0; j<2; j++) {
            let elCell = document.createElement("td");
            let cellInfo= document.createTextNode("TODO: POPULATE WITH PLAYER INFO");
            elCell.appendChild(cellInfo);
            elRow.appendChild(elCell);
        }

        elTbl.appendChild(elRow);
    }

    elTablePara.appendChild(elTbl);
};

document.addEventListener("DOMContentLoaded", setupPage);
