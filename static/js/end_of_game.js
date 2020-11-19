// Global Variables
let gameID;

async function setupPage() {
    gameID = document.body.getAttribute("data-game-id");
    const elWinnerName = document.querySelector("#winnerName");
    const elWinnerPoints = document.querySelector("#winnerPoints");

    // Populate winning player info in html
    const playerList = await getPlayerList();
    let winningPlayer = "";
    let winningPlayerPoints = Infinity;

    for (const playerInfo of playerList) {
        const totalPoints = playerInfo["total_points"];
        if (totalPoints < winningPlayerPoints) {
            winningPlayerPoints = totalPoints;
            winningPlayer = playerInfo["player_name"];
            console.log("Current lowest player and points", winningPlayer, winningPlayerPoints);
        }
    }
    elWinnerName.textContent = winningPlayer;
    elWinnerPoints.textContent = winningPlayerPoints;
}

async function getPlayerList() {
    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Is the Game ID correct?");
        return;
    }

    const responseJson = await response.json();
    const playerList = responseJson["players"];
    return playerList;
}


document.addEventListener("DOMContentLoaded", setupPage);
