function setupPage() {
    const gameId = document.body.getAttribute("data-game-id");

    getGameInfo(gameId);


}

async function getGameInfo(game_id) {
    const response = await fetch(`/api/game/${game_id}`);
    const jsonData = await response.json();

    const gameState = jsonData['state'];
    console.log("Game State is", gameState);
    if (gameState !== "waiting") {
        // TODO: redirect
        return;
    };

    const players = jsonData['players'];
    console.log("The players are", players);

    // NEXT STEPS:
    // 1) dynamically create table with avatar & players
    // 2) show players the current room number to give their friends
    // 3) make client refresh getGameInfo regularly
    // 4) implement redirect (TODO above)
    // ...
    // x) make game start button work

}

document.addEventListener("DOMContentLoaded", setupPage);
