function setupPage() {
    const gameID = document.body.getAttribute("data-game-id");
    const playerID = document.body.getAttribute("data-player-id");

    setInterval(function() {updatePoints(gameID)}, 10*1000); //Temporary fix; later update when cards played


};

async function updatePoints(gameID) {
    /*
    Response:
    {
        "id": game id,
        "players": [player data as per API get_player_information],
        "state": game state string,
    }
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
        alert("API didn't work, shouldn't happen");
        return;
    }

    const responseJson = await response.json();

    for (const player of responseJson["players"]) {
        const playerID = player["player_id"];
        const crntPoints = player["current_points"];

        document.querySelector(`td[data-player-id='${playerID}'] .currentPoints`).textContent = crntPoints;
    }
}

// TODO: Start on Hand Content of HTML & Javascript

document.addEventListener("DOMContentLoaded", setupPage);
