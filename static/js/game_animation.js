// @app.route('/api/game/<int:game_id>/roundstate/<int:round_number>', methods=["GET"])
// def get_round_notation(game_id: int, round_number: int):
//     """
//     ZF: Players poll for round_state. If 'Between Rounds', update client with new stack info
//     Response:{
//     "everyone_played": Boolean
//     "data": none or List({
//                 "round_number": self._round,
//                 "player": player JSON,
//                 "played_card": card JSON,
//                 "old_stack_index": int of stack being worked on
//                 "old_stack": [card JSON, card JSON, ...],
//                 "new_stack": [card JSON, card JSON, ...],
//                 "stack_replaced": stack_replaced #if False, then it was just appended
//     })
//     }
//     """

// IDEA ONE: Go through stacks and show how each stack changed



// IDEA TWO: Go through the players and show what each player did
// This one already has the right info in game notation (though I need to sort the players by the card thats played)
// Find player through player ID

const TIMER_MS = 3*1000;

export function animatePlay(data) {
    console.log("I'm in animatePlay()")
    // Call helper function to set timeout and give each round some breathing space
    _animatePlay(data, 0);
}

function _animatePlay(data, index) {
    // Get all important info and elements on page
    const entry = data[index];
    const playerID = entry["player"]["player_id"]; // int of player ID
    const elPlayer = document.querySelector(`#playerOverview [data-player-id="${playerID}"]`);
    const crntStackIndex = entry["old_stack_index"];
    const oldStack = entry["old_stack"];
    const newStack = entry["new_stack"];
    const playedCard = entry["played_card"];
    console.log("PLAYED CARD IS");
    console.log(playedCard);
    const stackReplaced = entry["stack_replaced"];

    // highlight stack (aka row full of td elements) we are working on
    const elHighlightedStack = highlightCrntStack(crntStackIndex);
    console.log(elHighlightedStack);
    elHighlightedStack.classList.add("highlighted");

    // highlight current player
    elPlayer.classList.add("highlighted");

    // Deal with stack, if it is being replaced
    if (stackReplaced) {
        console.log("Stack needs replacement animation")
        stackExit(elHighlightedStack);
    }
    // Add the new card by iterating through the stack
    setTimeout(function() {addNewCard(newStack, playedCard, elHighlightedStack)}, 1*1000);

    // end of loop cleanup, happens after a certain timeout
    setTimeout(function() {
        elHighlightedStack.classList.remove("highlighted")
        elPlayer.classList.remove("highlighted");
    }, TIMER_MS);

    // If there is more data to go, call this function again with index incremented by 1
    if (index+1 < data.length) {
        setTimeout(function() {_animatePlay(data, index+1)}, TIMER_MS);
    }
}

function highlightCrntStack(crntStackIndex) {
    const elStacks = document.querySelectorAll("#stacks tr"); // returns [tr, tr, tr, tr]
    const elHighlightedStack = elStacks[crntStackIndex];
    return elHighlightedStack;
}

function addNewCard(newStack, playedCard, elHighlightedStack) {
    // Pulls out each card in newStack and makes it a column in this row
    for (let col=0; col<5; col++) {
        const currentCard = newStack[col];
        const elCurrentCell = elHighlightedStack.querySelector(`td:nth-child(${col+1})`);

        // sets cardValue to -1 for blanked out look, then overwrites if card exists
        let currentCardValue = -1;
        if (currentCard) {
            currentCardValue = currentCard["value"];
        }

        // Fit my-card into the right cell
        const elNewCard = document.createElement("my-card");
        elNewCard.cardValue = currentCardValue;
        elNewCard.location = 'table';
        elCurrentCell.innerHTML = "";
        elCurrentCell.appendChild(elNewCard);

        if (currentCardValue === playedCard["value"]) {
            elNewCard.classList.add("newCardAnimation"); //TODO: Add fading out animation in css
        }

        // Removes Animation-class after same timer as stack & player highlight
        setTimeout(function() {
            elNewCard.classList.remove("newCardAnimation");
        }, TIMER_MS);
    }
}

function stackExit(elHighlightedStack) {
    // mark all cards in stack with new classname
    elHighlightedStack.classList.add('animate__animated', 'animate__bounceOutLeft');
    // TODO: get ou tof his file

    // Remove Classlist after animation complete
    elHighlightedStack.addEventListener('animationend', () => {
        elHighlightedStack.classList.remove('animate__animated', 'animate__bounceOutLeft');
    });
}
