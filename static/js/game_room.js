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

let GAME_ID = -1;
let PLAYER_ID = -1;

let roundNumber = document.body.getAttribute("data-round-no") - 1;


// Game

function setupPage() {
    console.log("Round Number", roundNumber)
    GAME_ID = document.body.getAttribute("data-game-id");
    PLAYER_ID = document.body.getAttribute("data-player-id");
    const elConfirmCardForm = document.querySelector("#confirmCardForm");

    initialPopulateStacks();

    for (const elCard of document.querySelectorAll(".card")) {
        elCard.addEventListener("click", chooseCard); // Shows chosen card and lets player confirm action
    }

    elConfirmCardForm.addEventListener("submit", function(event) {submitConfirmCardForm(event)});

    globalState = GameState.WAITING_TO_CHOOSE_CARD;
};


// Function Collection

async function initialPopulateStacks() {
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

    const response = await fetch(`/api/game/${GAME_ID}`);
    if (!response.ok) {
        alert("API didn't work. Does Game ID exist?");
        return;
    }

    const responseJson = await response.json();
    const stackData = responseJson["stacks"];
    const elTable = document.querySelector('#stacks table');

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

function chooseCard(event) {
    // Allows player to chose a Card
    const elCard = event.currentTarget;
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


async function submitConfirmCardForm(event) {
    // Sending confirmed card info to the server, then game freezes and we wait
    event.preventDefault();
    const elConfirmCardForm = document.querySelector("#confirmCardForm");
    const chosenCardValue = document.querySelector("#chosenCardValue").textContent;
    const elChosenCard = document.querySelector(".chosenCard");
    const elHandCardsDiv = document.querySelector("#handCards");

    const data = { "selected_card" : chosenCardValue };

    const response = await fetch(`/api/game/${GAME_ID}/player/${PLAYER_ID}/card_selected`, {
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

    globalState = GameState.WAITING_FOR_EVERYONE_TO_CONFIRM;

    // Ups roundNumber by one to ensure we grad the right roundNotation
    roundNumber += 1;

    // Poll every n seconds to see if other players have played
    periodicTimerID = setInterval(function() {getRoundNotation()}, 5*1000);
}

async function getRoundNotation() {
    /*
    Response:{
        "everyone_played": Boolean
        "data": none or List({
                    "round_number": self._round,
                    "player": player JSON,
                    "played_card": card JSON,
                    "old_stack": [card JSON, card JSON, ...],
                    "new_stack": [card JSON, card JSON, ...],
                    "stack_replaced": stack_replaced #if False, then it was just appended
        })
    */

    const response = await fetch(`/api/game/${GAME_ID}/roundstate/${roundNumber}`);
    if (!response.ok) {
        alert("API roundstate didn't work. Is Game ID correct?");
    }

    const responseJson = await response.json();

    // if everyone has played we get data and continue. Otherwise, back to polling.
    if (!responseJson["everyone_played"]) {
        return;
    }

    globalState = GameState.DISPLAY_PLAYED_ROUND
    const data = responseJson["data"];
    // TODO - use this to do animation. Maybe feed it to updatePointsandStacks?

    updatePointsAndStacks();
}

async function updatePointsAndStacks() {
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

    const response = await fetch(`/api/game/${GAME_ID}`);
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

    // Stops polling
    clearInterval(periodicTimerID);

    // Updates Player Points; TODO: Add Animation of points going up
    for (const player of responseJson["players"]) {
        const PLAYER_ID = player["player_id"];
        const crntPoints = player["current_points"];

        document.querySelector(`td[data-player-id='${PLAYER_ID}'] .currentPoints`).textContent = crntPoints;
    }

    const stackData = responseJson["stacks"];
    const table = document.querySelector('#stacks table');

    // Pulls out each card per stack and adds it to the stack table on page; TODO: animation
    console.log("Stack Data", stackData);
    for (let col=0; col<stackData.length; col++) {
        let currentStack = stackData[col];

        //for (let row=0; row<currentStack.length; row++) { Trying something new
        for (let row=0; row<6; row++) {
            let currentCard = currentStack[row];

            // if this card doesn't exist, overwrite cell with empty
            if (!currentCard) {
                table.querySelector(`tr:nth-child(${row+1}) td:nth-child(${col+1})`).innerHTML = '';
                continue;
            }

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

    // gets current serverState and redirects accordingly
    // TODO: temporary fix is 5 sec delay. When animation added, redirect after animation done
    const serverState = responseJson["state"];
    console.log(new Date(), "State Data", serverState);

    if (serverState === "Between Games") {
        console.log(new Date(), "Server State is Between Games. 5 second countdown should start")
        setTimeout(() => location.assign(`/inbetween_rounds/${GAME_ID}/${PLAYER_ID}`), 5*1000);
        return;
    } else if (serverState === "End of Game") {
        console.log(new Date(), "Server State is End of Game. 5 second countdown should start")
        setTimeout(() => location.assign(`/end_of_game/${GAME_ID}/${PLAYER_ID}`), 5*1000);
        return;
    } else {
        // If game continues, players can play again thanks to GameState
        console.log("Server State indicates game is still going. Reactivating buttons")
        globalState = GameState.WAITING_TO_CHOOSE_CARD;
    }
}

document.addEventListener("DOMContentLoaded", setupPage);
