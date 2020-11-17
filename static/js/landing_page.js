async function startNewGame(formData) {
    // Converts the FormData object to a dictionary, so we can JSONify it.
    const data = {};
    for (const pair of formData) {
        data[pair[0]] = pair[1];
    }

    // Post the JSON-safe data to the API.
    const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        const jsonData = await response.json();
        console.log(jsonData);
        const gameId = jsonData['game_id'];
        const playerId = jsonData['player_id'];
        location.assign(`/waiting_room/${gameId}/${playerId}`);
    } else if (response.status === 401) {
        console.log("Invalid Playername");
        alert("invalid playername. Please try again.");
    }
};

async function joinGame(formData) {
    // Converts the FormData object to a dictionary, so we can JSONify it.
    const data = {};
    for (const pair of formData) {
        data[pair[0]] = pair[1];
    }

    const response = await fetch(`/api/game/${roomNumber}/player`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        const jsonData = await response.json();
        console.log(jsonData);

        const playerId = jsonData['player_id'];
        location.assign(`/waiting_room/${roomNumber}/${playerId}`);
    } else if (response.status === 404) {
        console.log("Room number doesn't exist");
        alert("This room number does not exist. Please try again.")
    } else if (response.status === 401) {
        console.log("Invalid Playername");
        alert("invalid playername. Please try again.");
    };
};



function setupPage() {
    const elStartButton = document.querySelector("#startButton");
    const elJoinButton = document.querySelector("#joinButton");
    const elStartForm = document.querySelector("#startGameForm");
    const elBackButton1 = document.querySelector(".backButton1");
    const elBackButton2 = document.querySelector(".backButton2");
    const elJoinGameForm = document.querySelector("#joinGameForm")

    elStartButton.addEventListener("click", function(event) {
        elStartForm.classList.remove("hidden");
        elBackButton1.classList.remove("hidden");
        elJoinButton.classList.add("hidden");
    });

    elStartForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        document.querySelector("#startGameForm input[type='submit']").disabled = true;
        startNewGame(data);
    });

    elBackButton1.addEventListener("click", function(event) {
        elStartForm.classList.add("hidden");
        elJoinButton.classList.remove("hidden");
        elBackButton1.classList.add("hidden");
    });

    elJoinButton.addEventListener("click", function(event) {
        elJoinGameForm.classList.remove("hidden");
        elStartButton.classList.add("hidden");
        elBackButton2.classList.remove("hidden");
    });

    elBackButton2.addEventListener("click", function(event) {
        elJoinGameForm.classList.add("hidden");
        elStartButton.classList.remove("hidden");
        elBackButton2.classList.add("hidden");
    });

    elJoinGameForm.addEventListener("submit", function(event) {
        event.preventDefault();
        document.querySelector("#joinGameForm input[type='submit']").disabled = true;
        const formData = new FormData(event.target);
        joinGame(formData);
    });
}


document.addEventListener("DOMContentLoaded", setupPage);
