// Global State & Variables
import { animatePlay } from "./game_animation.js";

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

    initialStackPopulation();

    updatePointsAndStacks(); // populates stacks

    for (const elCard of document.querySelectorAll("my-card")) {
        elCard.addEventListener("click", chooseCard); // Shows chosen card and lets player confirm action
    }

    elConfirmCardForm.addEventListener("submit", function(event) {submitConfirmCardForm(event)});

    globalState = GameState.WAITING_TO_CHOOSE_CARD;
};

// Function Collection
async function initialStackPopulation() {
    const response = await fetch(`/api/game/${GAME_ID}`);
    if (!response.ok) {
        alert("API didn't work. Does Game ID exist?");
        return;
    }
    const responseJson = await response.json();
    const x = initialStackPopulation;
    x();

    const stackData = responseJson["stacks"];
    const table = document.querySelector('#stacks table');

    // Pulls out each card per stack and adds it to the stack table on page; TODO: animation
    console.log("Stack Data", stackData);

    // Pulls out each stackData entry (=stack) as beginning of row
    for (let row=0; row<stackData.length; row++) {
        const currentStack = stackData[row];

        // Pulls out each entry in stack and makes it a column in row
        for (let col=0; col<5; col++) {
            const currentCard = currentStack[col];

            // if this card does exist, overwrite cell with actual card
            let cardValue = -1;
            if (currentCard) {
                cardValue = currentCard["value"];
            }
            const elCurrentCell = table.querySelector(`tr:nth-child(${row+1}) td:nth-child(${col+1})`)

            // Fit my-card into the right cell
            const elNewCard = document.createElement("my-card");
            elNewCard.cardValue = cardValue;
            elNewCard.location = 'table';
            elCurrentCell.innerHTML = "";
            elCurrentCell.appendChild(elNewCard);
        }
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
    const elChosenCardValue = elCard.cardValue;
    document.querySelector("#chosenCardValue").textContent = elChosenCardValue;

    // Have the document focus on input field
    document.getElementById("inputBtn").focus();
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
    const elWaitingDiv = document.querySelector("#waitingForOthers");
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
    console.log("THIS IS THE GAMESTATE DATA");
    console.log(data);
    animatePlay(data);

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
            "last_eaten_points": str of last eaten points or empty
            "avatar": filename of player avatar
        }]
    */

    const response = await fetch(`/api/game/${GAME_ID}`);
    if (!response.ok) {
        alert("API didn't work. Does Game ID exist?");
        return;
    }

    const responseJson = await response.json();

    // Removes "Waiting for others" Div (first time none)
    const elWaitingDiv = document.querySelector("#waitingForOthers");
    if (elWaitingDiv) {
        elWaitingDiv.classList.add("hidden");
    }

    // Remove Chosen Card (first time none)
    const elChosenCard = document.querySelector(".chosenCard");
    if (elChosenCard) {
        elChosenCard.classList.remove("chosenCard");
        elChosenCard.classList.add("hidden");
    }

    // Stops polling
    clearInterval(periodicTimerID);
    periodicTimerID = 0; // for Interval, means "no ID"

    // Updates Player Points; link to animation
    for (const player of responseJson["players"]) {
        const PLAYER_ID = player["player_id"];
        const crntPoints = player["current_points"];
        const lastEatenPoints = player["last_eaten_points"];
        const crntPlayer = document.querySelector(`span[data-player-id='${PLAYER_ID}']`);

        crntPlayer.querySelector(`.currentPoints`).textContent = crntPoints;

        if (lastEatenPoints != "") {
            animatePoints(crntPlayer, lastEatenPoints);
        }
    }

    /*
    const stackData = responseJson["stacks"];
    const table = document.querySelector('#stacks table');

    // Pulls out each card per stack and adds it to the stack table on page; TODO: animation
    console.log("Stack Data", stackData);

    // Pulls out each stackData entry (=stack) as beginning of row
    for (let row=0; row<stackData.length; row++) {
        const currentStack = stackData[row];

        // Pulls out each entry in stack and makes it a column in row
        for (let col=0; col<5; col++) {
            const currentCard = currentStack[col];

            // if this card does exist, overwrite cell with actual card
            let cardValue = -1;
            if (currentCard) {
                cardValue = currentCard["value"];
            }
            const elCurrentCell = table.querySelector(`tr:nth-child(${row+1}) td:nth-child(${col+1})`)

            // Fit my-card into the right cell
            const elNewCard = document.createElement("my-card");
            elNewCard.cardValue = cardValue;
            elNewCard.location = 'table';
            elCurrentCell.innerHTML = "";
            elCurrentCell.appendChild(elNewCard);
        }
    } */

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

function animatePoints(crntPlayer, lastEatenPoints) {
    // Creates Element with animation CSS classes on it
    const elEatenPointsSpan = document.createElement("span");
    elEatenPointsSpan.classList.add("eatenPoints");
    elEatenPointsSpan.classList.add("animate__animated");
    elEatenPointsSpan.classList.add("animate__fadeOutUp");

    // Fills it with player.last_eaten_points()
    elEatenPointsSpan.textContent = `    ${lastEatenPoints}`;

    // attaches it
    crntPlayer.querySelector(`.pointWrapper`).appendChild(elEatenPointsSpan);

    // removes it after its been done
    setTimeout(function() {crntPlayer.querySelector(`.pointWrapper`).removeChild(elEatenPointsSpan)}, 3*1000);
}

document.addEventListener("DOMContentLoaded", setupPage);
