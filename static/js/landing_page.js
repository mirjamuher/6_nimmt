async function startNewGame(playerName) {
    const data = { "p1_name" : playerName };

    const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(data),
    });
    const jsonData = await response.json();
    console.log(jsonData);

    const gameId = jsonData['game_id'];
    const playerId = jsonData['player_id'];

    location.assign(`/waiting_room/${gameId}/${playerId}`);
};



function setupPage() {
    const elStartButton = document.querySelector("#startButton");
    const elJoinButton = document.querySelector("#joinButton");
    const elStartForm = document.querySelector("#startGameForm");

    elStartButton.addEventListener("click", function(event) {
        elStartForm.classList.remove("hidden");
        elJoinButton.classList.add("hidden");
    });

    elStartForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const playerName = document.querySelector("#p1Name").value;
        startNewGame(playerName);
    });


}








document.addEventListener("DOMContentLoaded", setupPage);

