// Global State & Variables
const GameState = {
    GAME_SETUP: 1,
    WAITING_TO_CHOOSE_CARD: 2,
    WAITING_TO_CONFIRM_CARD: 3,
    WAITING_FOR_EVERYONE_TO_CONFIRM: 4,
    DISPLAY_PLAYED_ROUND: 5,
};

let globalState = GameState.GAME_SETUP;
let periodicTimerID = 0;

// Game

// GOAL: call API with data None or Data Some. If Some, call function that updates points & stacks
// I need a first population of points & stacks --> DONE
// Constant Polling: Has everyone played yet?
// Now I need to discover if data is. If it is, that needs to call a stack update

function setupPage() {
    const gameID = document.body.getAttribute("data-game-id");
    const playerID = document.body.getAttribute("data-player-id");
    const elConfirmCardForm = document.querySelector("#confirmCardForm");

    initialPopulateStacks(gameID);

    for (const elCard of document.querySelectorAll(".card")) {
        elCard.addEventListener("click", chooseCard); // Shows chosen card and lets player confirm action
    }

    elConfirmCardForm.addEventListener("submit", function(event) {submitConfirmCardForm(event, gameID, playerID)});

    globalState = GameState.WAITING_TO_CHOOSE_CARD;
};


// Function Collection

async function initialPopulateStacks(gameID) {
    /*
    Response:
    {
        "id": game id,
        "players": [player data as per API get_player_information],
        "state": game state string,
        "stacks": [[Card, Optional[Card],...][-"-][-"-][-"-]],
    }
    # Card: {"value": cardvalue, "ochsen": ochsen} 
    */

    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Does Game ID exist?");
        return;   
    }

    const responseJson = await response.json();
    const stackData = responseJson["stacks"];
    const elTable = document.querySelector('#stacks table');

    //const elCurrentCell = table.querySelector(`tr:nth-child(${row+1}) td:nth-child(${col+1})`)

    for (let col = 0; col<stackData.length; col++) {
        const elCurrentCell = elTable.querySelector(`tr:nth-child(1) td:nth-child(${col+1})`)
        const cardData = stackData[col][0];

        const elCard = document.createElement("div");
        elCard.classList.add("card");
        elCard.classList.add("noHover");

        const elCardValue = document.createElement("span");
        elCardValue.classList.add("cardValue");
        elCardValue.textContent = cardData["value"];

        const elOchsenValue = document.createElement("span");
        elOchsenValue.classList.add("ochsenValue");
        elOchsenValue.textContent = cardData["ochsen"];

        elCard.appendChild(elCardValue);
        const elBr = document.createElement("br");
        elCard.appendChild(elBr);
        elCard.appendChild(elOchsenValue);
        elCurrentCell.appendChild(elCard);
        //elRow.appendChild(elCurrentCell);
    }
}


async function updatePointsAndStacks(gameID) {
    /*
    Response:
    {
        "id": game id,
        "players": [player data as per API get_player_information],
        "state": game state string,
        "stacks": [[Card, Optional[Card],...][-"-][-"-][-"-]],
    }
    # Card: {"value": cardvalue, "ochsen": ochsen}

        [{
            "player_name": str of player name
            "player_id": int of player id
            "player_no": int of player number
            "current_points" : self._current_points,
            "total_points": int of player points
            "avatar": filename of player avatar
        }]
    */

    const response = await fetch(`/api/game/${gameID}`);
    if (!response.ok) {
        alert("API didn't work. Does Game ID exist?");
        return;
    }

    const responseJson = await response.json();

    // Removes "Waiting for others" Div
    elWaitingDiv = document.querySelector("#waitingForOthers");
    elWaitingDiv.classList.add("hidden");

    // Remove Chosen Card
    elChosenCard = document.querySelector(".chosenCard");
    elChosenCard.classList.remove("chosenCard");
    elChosenCard.classList.add("hidden");
    //TODO: make sure card is not selectable anymore!

    // Stops polling
    clearInterval(periodicTimerID);

    // Updates Player Points; TODO: Add Animation of points going up
    for (const player of responseJson["players"]) {
        const playerID = player["player_id"];
        const crntPoints = player["current_points"];

        document.querySelector(`td[data-player-id='${playerID}'] .currentPoints`).textContent = crntPoints;
    }

    const stackData = responseJson["stacks"];
    const table = document.querySelector('#stacks table');

    // Pulls out each card per stack and adds it to the stack table on page; TODO: animation
    for (let col=0; col<stackData.length; col++) {
        let currentStack = stackData[col];

        for (let row=0; row<currentStack.length; row++) {
            let currentCard = currentStack[row];
            const cardValue = currentCard["value"];
            const ochsen = currentCard["ochsen"];
            const elCurrentCell = table.querySelector(`tr:nth-child(${row+1}) td:nth-child(${col+1})`)

            // Create Element Div, nestle in it new created Elements span with value and ochsen
            const elNewCard = document.createElement("div");
            elNewCard.classList.add("card");
            elNewCard.classList.add("noHover");

            const elCardValue = document.createElement("span");
            elCardValue.classList.add("cardValue");
            elCardValue.textContent = cardValue;

            const elBr = document.createElement("br");
            elCardValue.appendChild(elBr);

            const elCardOchsen = document.createElement("span");
            elCardOchsen.classList.add("cardOchsen");
            elCardOchsen.textContent = ochsen;

            elNewCard.appendChild(elCardValue);
            elNewCard.appendChild(elCardOchsen);

            elCurrentCell.innerHTML = "";
            elCurrentCell.appendChild(elNewCard);
        }
    }



}

function chooseCard(event) {
    // Allows player to chose a Card
    const elCard = event.target;
    const elConfirmCardForm = document.querySelector("#confirmCardForm");

    if (globalState === GameState.WAITING_TO_CHOOSE_CARD) {
        // Select new card -> after if statement
    } else if (globalState === GameState.WAITING_TO_CONFIRM_CARD) {
        // Is clicked card already selected? If so, unselect and go back to waiting gameState
        if (elCard.classList.contains("chosenCard")) {
            elCard.classList.remove("chosenCard");
            elConfirmCardForm.classList.add("hidden");
            globalState = GameState.WAITING_TO_CHOOSE_CARD;
            return;
        } else {
            // Unselect the already-selected card
            const oldCard = document.querySelector(".chosenCard");
            oldCard.classList.remove("chosenCard");
        }
    } else {
        // if its any other gameState, nothing happens
        return;
    }

    // Select the new card
    elCard.classList.add("chosenCard");
    elConfirmCardForm.classList.remove("hidden");
    globalState = GameState.WAITING_TO_CONFIRM_CARD;

    // Update chosenCardValue in confirmCardForm
    const elChosenCardValue = elCard.getAttribute("data-card-value");
    document.querySelector("#chosenCardValue").textContent = elChosenCardValue;
}


async function submitConfirmCardForm(event, gameID, playerID) {
    // Sending confirmed card info to the server, then game freezes and we wait
    event.preventDefault();
    const elConfirmCardForm = document.querySelector("#confirmCardForm");
    const chosenCardValue = document.querySelector("#chosenCardValue").textContent;
    const elChosenCard = document.querySelector(".chosenCard");
    const elHandCardsDiv = document.querySelector("#handCards");

    const data = { "selected_card" : chosenCardValue };

    const response = await fetch(`/api/game/${gameID}/player/${playerID}/card_selected`, {
        method: 'PUT',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (response.status !== 201) {
        alert("API didn't work. Was a valid card selected?");
        return;
    }

    // Hide Form and grey out selected card
    elConfirmCardForm.classList.add("hidden");
    elHandCardsDiv.classList.add("lockedIn");

    // Add "waiting for other players" div
    elWaitingDiv = document.querySelector("#waitingForOthers");
    elWaitingDiv.classList.remove("hidden");

    // Poll every n seconds to see if other players have played
    periodicTimerID = setInterval(function() {updatePointsAndStacks(gameID)}, 5*1000);


    globalState = GameState.WAITING_FOR_EVERYONE_TO_CONFIRM;
}


document.addEventListener("DOMContentLoaded", setupPage);
