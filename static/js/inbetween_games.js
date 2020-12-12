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

    // Regular polling to see if next round is entered
    periodicTimerID = setInterval(isNextGameReady, 3*1000); //TODO: Implement "Please wait" animation

    // Animation for round points merging with existing points
    setTimeout(async function() {
        // call data-player-in-tr-ID and get right player points

        const elPointTableRowList = document.querySelectorAll(".pointTableRow") // pulls out all the rows in list

        for (const elRow of elPointTableRowList) {
            const currentPlayerTotalPoints = elRow.getAttribute("data-player-in-tr-points");
            const elAddingPoints = elRow.querySelector(".addingPoints");
            const elPlayerPoints = elRow.querySelector(".playerPoints");

            elAddingPoints.classList.add("hidden") // hides the added points span
            elPlayerPoints.textContent = currentPlayerTotalPoints; // updates to total Points
        }
    }, 3*1000)

    // Make Buttons responsive
    if (elEndGameButton) {
        elEndGameButton.addEventListener("click", endGameQuestion);
    }
    if (elStartButton) {
        elStartButton.addEventListener("click", questionStartNextGame);
    }
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
        return;
    }
}

async function isNextGameReady() {
    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Is game ID correct?");
        return;
    }

    const responseJson = await response.json();
    const gameState = responseJson["state"];

    if (gameState === "End of Game") {
        clearInterval(periodicTimerID);
        location.assign(`/end_of_game/${gameID}/${playerID}`);
    } else if (gameState !== 'Between Games') {
        clearInterval(periodicTimerID);
        location.assign(`/game/${gameID}/${playerID}`);
    }
}

async function endGameQuestion() {
    // TODO: End the game and remove from GameManager
    const result = confirm("Are you sure you want to end the game for everyone?");

    if (result) {
        elStartButton.disabled = true;
        elEndGameButton.disabled = true;
        await endGame();
        return;
    };
}

async function endGame() {
    const response = await fetch(`/api/game/${gameID}/end`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    });

    if (!response.ok) {
        alert("API didn't work. Is the Game ID correct?");
        return;
    }

    const responseJson = await response.json();
    if (responseJson["state"] !== "End of Game") {
        alert("Game has not been properly ended!");
        return;
    }
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
