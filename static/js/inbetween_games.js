const gameID = document.body.getAttribute("data-game-id");
const playerID = document.body.getAttribute("data-player-id")
const elStartButton = document.querySelector("#startButton");
const elEndGameButton = document.querySelector("#endGameButton");
const elWaitingInfo = document.querySelector("#waitingInfo");

async function setupPage() {
    const playerNumber = await getPlayerNumber();
    const elAddingPoints = document.querySelectorAll(".addingPoints");
    const elPlayerPoints = document.querySelectorAll(".playerPoints");

    console.log(playerNumber);
    console.log(elStartButton);
    console.log(elEndGameButton);
    console.log(elWaitingInfo);

    if (playerNumber === 1) {
        elStartButton.addEventListener("click", startNextGame);
        elEndGameButton.addEventListener("click", endGameQuestion);
        elStartButton.classList.remove("hidden");
        elEndGameButton.classList.remove("hidden");
        console.log("I have entered the if Player Number 1 loop");
    } else {
        elWaitingInfo.classList.remove("hidden");
        console.log("I have entered the not Player Number 1 loop");
    }

    setTimeout(async function() {
        for (const element of elAddingPoints) {
            element.classList.add("hidden");
        }
        for (const element of elPlayerPoints) {
            element.textContent = await getPlayerPoints();
        }
    }, 1*1000)
}

function startNextGame() {
    // TODO: Reroute back to Game_Room
    const result = confirm("Is everyone ready to start the next round?");

    if (result) {
        elStartButton.disabled = true;
        elEndGameButton.disabled = true;
        startGame(gameID);
    };
}

function endGameQuestion() {
    // TODO: End the game and remove from GameManager
    const result = confirm("Are you sure you want to end the game for everyone?");

    if (result) {
        elStartButton.disabled = true;
        elEndGameButton.disabled = true;
        endGame(gameID);
    };
}

async function getPlayerNumber() {
    // returns the player number (not id)
    const response = await fetch(`/api/game/${gameID}/player/${playerID}`);
    if (!response.ok) {
        alert("API didn't work. Game or Player ID not correct");
        return;
    }

    const responseJson = await response.json();
    console.log("This is responseJson in getPlayerNumber", responseJson)

    const playerNumber = responseJson["player_no"];
    console.log("This is playerNumber in getPlayerNumber", playerNumber)
    return playerNumber;
}

document.addEventListener("DOMContentLoaded", setupPage);

async function getPlayerPoints() {
    // returns the total points of players
    const response = await fetch(`/api/game/${gameID}/player/${playerID}`);
    if (!response.ok) {
        alert("API didn't work. Game or Player ID not correct");
        return;
    }
    const responseJson = await response.json();
    const playerPoints = responseJson["total_points"];
    return playerPoints;
}
