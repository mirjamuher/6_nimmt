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

export function animatePlay(data) {
    console.log("I'm in animatePlay()")
    for (let entry of data) {
        console.log(`ROUND X - entry is ${entry}`);
        // Get all important info and elements on page
        const playerID = entry["player"]["player_id"]; // int of player ID
        const elPlayer = document.querySelector(`[data-player-id="${playerID}"]`);
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

        // If stack is not replaced, only new card is added -> make its own function?
        if (!stackReplaced) {
            console.log("Only new card needs adding");

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
            }
        }

        // Animation if stack is being replaced
        if (stackReplaced) {
            console.log("Stack needs replacement animation")
        }

        // end of loop cleanup
        elHighlightedStack.classList.remove("highlighted")
        elPlayer.classList.remove("highlighted");
    }
}

function highlightCrntStack(crntStackIndex) {
    const elStacks = document.querySelectorAll("#stacks tr"); // returns [tr, tr, tr, tr]
    const elHighlightedStack = elStacks[crntStackIndex];
    return elHighlightedStack;
}
