/* INFO IN VARIABLE "DATA":

@app.route('/api/game/<int:game_id>/roundstate/<int:round_number>', methods=["GET"])
def get_round_notation(game_id: int, round_number: int):
    """
    ZF: Players poll for round_state. If 'Between Rounds', update client with new stack info
    Response:{
    "everyone_played": Boolean
    "data": none or List({
                "round_number": self._round,
                "player": player JSON,
                "played_card": card JSON,
                "old_stack_index": int of stack being worked on
                "old_stack": [card JSON, card JSON, ...],
                "new_stack": [card JSON, card JSON, ...],
                "stack_replaced": stack_replaced #if False, then it was just appended
                "is_lowest_card": True if card played lowest value on table
    })
    }
    """
*/

export async function animatePlay(data) {
    console.log("I'm in animatePlay()")
    // Call helper function (promise object) to ensure each animation finishes before next starts
    await _animatePlay(data, 0);
}

async function _animatePlay(data, index) {
    // Get all important info and elements on page
    const entry = data[index];
    const playerID = entry["player"]["player_id"]; // int of player ID
    const elPlayer = document.querySelector(`#playerOverview [data-player-id="${playerID}"]`);
    let crntStackIndex = entry["old_stack_index"];
    const oldStack = entry["old_stack"];
    const newStack = entry["new_stack"];
    const playedCard = entry["played_card"];
    const isLowestCard = entry["is_lowest_card"]; // True or False
    console.log("PLAYED CARD IS");
    console.log(playedCard);
    const stackReplaced = entry["stack_replaced"]; // True or False

    // highlight stack (aka row full of td elements) we are working on
    const elHighlightedStack = findCrntStack(crntStackIndex);
    elHighlightedStack.classList.add("highlighted");

    // highlight current player
    elPlayer.classList.add("highlighted");

    // Add animation
    if (isLowestCard) {
        // If Card is lowest card, remove lowest value stack, add lowest card stack
        // Step 1: Animation of current stack being removed
        await stackExit(elHighlightedStack);
        // Step 2: After completed, append the new stack to the first line
        appendStackInFirstLine(elHighlightedStack);
        // Step 3: add the new card to first stack -> done in addNewCard
        crntStackIndex = 0;
    } else if (stackReplaced) {
        // If played card is the sixth, stack gets replaced
        await stackExit(elHighlightedStack);
        cleanStackRow(elHighlightedStack)
    }

    // New Card gets added animation
    await addNewCard(newStack, crntStackIndex);
    elHighlightedStack.classList.remove("highlighted");
    elPlayer.classList.remove("highlighted");

    // If there is more data to go, call this function again with index incremented by 1
    if (index+1 < data.length) {
        _animatePlay(data, index+1);
    }
}

function findCrntStack(crntStackIndex) {
    const elStacks = document.querySelectorAll("#stacks tr"); // returns [tr, tr, tr, tr]
    const elHighlightedStack = elStacks[crntStackIndex];
    return elHighlightedStack; // returns tr
}

function addNewCard(newStack, crntStackIndex) {
    const elHighlightedStack = findCrntStack(crntStackIndex);

    /*
    Explanation:
    1) make a Promise (_animatePlay() will not continue until addNewCard() has been resolved)
    2) Inside Promise we say "after 1 second (first Timeout) add the my-card element"
    3) Inside Timeout we say "after 1 second (second Timeout), call "resolved" on this Promise"
    4) Promise object returns resolved, _animatePlay() can resume and removes #highlighted
    */

    return new Promise((resolve, reject) => {
        setTimeout(function () {
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
            }

            // In order to have the new card in a highlighted stack for one second, we add another Timeout
            setTimeout(function() {
                resolve();
            }, 1*1000);

        }, 1*1000);
    })
}

function stackExit(elHighlightedStack) {
    return new Promise((resolve, reject) => {
        // mark all cards in stack with new classname
        elHighlightedStack.classList.add('animate__animated', 'animate__bounceOutLeft');
        // TODO: get ou tof his file

        // Remove Classlist after animation complete
        elHighlightedStack.addEventListener('animationend', () => {
            elHighlightedStack.classList.remove('animate__animated', 'animate__bounceOutLeft');
            resolve();
        });
    });
}

function appendStackInFirstLine(firstStack) {
    // 1) clean content of the stack we are currently working on
    const elTable = document.querySelector('#stacks table');
    cleanStackRow(firstStack)
    // 2) add empty stack into first row and highlight it
    elTable.insertBefore(firstStack, elTable.firstChild);
    firstStack.classList.add("highlighted");
}

function cleanStackRow(stack) {
    for (let td of stack.querySelectorAll('td')) {
        const elNewCard = document.createElement("my-card");
        elNewCard.cardValue = -1;
        elNewCard.location = 'table';
        td.innerHTML = "";
        td.appendChild(elNewCard);
    }
}
