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
        for (const element of elAddingPointsList) {
            element.classList.add("hidden");
        }

        console.log("elPlayerPointsList is", elPlayerPointsList);

        for (let i = 0; i < elPlayerPointsList.length; i++) {
            elPlayerPointsList[i].textContent = await getPlayerPoints(i);
            console.log("Updated", elPlayerPointsList[i]);
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

async function getPlayerPoints(i) {
    // returns the total points of players
    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Game ID not correct");
        return;
    }

    const responseJson = await response.json();
    console.log("responseJson is", responseJson);
    const playerList = responseJson["players"]
    console.log("playerList is", playerList);
    console.log("playerNumber is", i);
    const playerPoints = playerList[i]["total_points"];
    console.log("Entered getPlayerPoints. Total points are", playerPoints)
    return playerPoints;
}

document.addEventListener("DOMContentLoaded", setupPage);
