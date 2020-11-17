// Global Variables (don't set them here, but in function setupPage)
let gameID, playerID, elStartButton, elEndGameButton, elWaitingInfo;
let periodicTimerID = 0;

async function setupPage() {
    gameID = document.body.getAttribute("data-game-id");
    playerID = document.body.getAttribute("data-player-id")
    elStartButton = document.querySelector("#startButton");
    elEndGameButton = document.querySelector("#endGameButton");
    elWaitingInfo = document.querySelector("#waitingInfo");

    const playerNumber = await getPlayerNumber();
    const elAddingPointsList = document.querySelectorAll(".addingPoints");
    const elPlayerPointsList = document.querySelectorAll(".playerPoints");

    // PLayer 1 sees a button to start/end game, everyone else waits
    if (playerNumber === 1) {
        elStartButton.addEventListener("click", questionStartNextGame);
        elEndGameButton.addEventListener("click", endGameQuestion);
        elStartButton.classList.remove("hidden");
        elEndGameButton.classList.remove("hidden");
        console.log("I have entered the if Player Number 1 loop");
    } else {
        elWaitingInfo.classList.remove("hidden");
        console.log("I have entered the not Player Number 1 loop");
    }

    // Regular polling to see if next round is entered
    periodicTimerID = setInterval(isNextGameReady, 1*1000);

    // Animation for round points merging with existing points
    setTimeout(async function() {
        for (const element of elAddingPointsList) {
            element.classList.add("hidden");
        }
        for (const element of elPlayerPointsList) {
            element.textContent = await getPlayerPoints();
        }
    }, 1*1000)
}

function questionStartNextGame() {
    // Confirms, then changes game_status, making everyone reroute
    const result = confirm("Is everyone ready to start the next round?");

    if (result) {
        elStartButton.disabled = true;
        elEndGameButton.disabled = true;
        activateStartGameLogic();
    };
}

async function activateStartGameLogic() {
    await fetch(`/api/game/${gameID}/start`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        }
    });

    if (!response.ok) {
        alert("Invalid game id. Did server crash?");
    }
}

async function isNextGameReady() {
    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Is game ID correct?")
    }

    const responseJson = await response.json();
    const gameState = responseJson["state"];

    if (gameState !== 'Between Games') {
        clearInterval(periodicTimerID);
        location.assign(`/game/${gameID}/${playerID}`);
    }
}


function endGameQuestion() {
    // TODO: End the game and remove from GameManager
    const result = confirm("Are you sure you want to end the game for everyone?");

    if (result) {
        elStartButton.disabled = true;
        elEndGameButton.disabled = true;
        endGame();
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

document.addEventListener("DOMContentLoaded", setupPage);
