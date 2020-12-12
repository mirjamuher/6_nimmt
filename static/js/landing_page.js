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
        return;
    } else if (response.status === 401) {
        console.log("Invalid Playername");
        alert("invalid playername. Please try again.");
    }

    const elStartFormBtn = document.querySelector("#startGameForm input[type='submit']");
    const elBackButton1 = document.querySelector(".backButton1");
    elStartFormBtn.disbaled = false;
    elBackButton1.disabled = false;
};

async function joinGame(formData) {
    // Converts the FormData object to a dictionary, so we can JSONify it.
    const data = {};
    for (const pair of formData) {
        data[pair[0]] = pair[1];
    }

    const roomNumber = data["room_number"];

    const response = await fetch(`/api/game/${roomNumber}/player`, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(data),
    });

    const jsonData = await response.json();
    console.log(jsonData);

    if (response.ok) {
        const playerId = jsonData['player_id'];
        location.assign(`/waiting_room/${roomNumber}/${playerId}`);
        return;
    } else if (response.status === 404) {
        console.log(jsonData["error"]);
        alert("This room number does not exist. Please try again.")
    } else if (response.status === 401) {
        console.log(jsonData["error"]);
        alert("invalid playername. Please try again.");
    } else if (response.status = 400) {
        console.log(jsonData["error"]);
        alert(jsonData["error"]);
    };
    const elJoinGameBtn = document.querySelector("#joinGameForm input[type='submit']");
    const elJoinGameForm = document.querySelector("#joinGameForm");
    const elBackButton2 = document.querySelector(".backButton2");

    elJoinGameForm.disabled = false;
    elJoinGameBtn.disabled = false;
    elBackButton2.disabled = false;
};



function setupPage() {
    const elStartButton = document.querySelector("#startButton");
    const elJoinButton = document.querySelector("#joinButton");
    const elStartForm = document.querySelector("#startGameForm");
    const elStartFormBtn = document.querySelector("#startGameForm input[type='submit']");
    const elBackButton1 = document.querySelector(".backButton1");
    const elBackButton2 = document.querySelector(".backButton2");
    const elJoinGameForm = document.querySelector("#joinGameForm");
    const elJoinGameBtn = document.querySelector("#joinGameForm input[type='submit']");

    elStartButton.addEventListener("click", function(event) {
        elStartForm.classList.remove("hidden");
        elBackButton1.classList.remove("hidden");
        elJoinButton.classList.add("hidden");
        elStartButton.classList.add("hidden");
    });

    elStartForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        elBackButton1.disabled = true;
        elStartFormBtn.disabled = true;
        startNewGame(data);
    });

    elBackButton1.addEventListener("click", function(event) {
        elStartForm.classList.add("hidden");
        elJoinButton.classList.remove("hidden");
        elStartButton.classList.remove("hidden");
        elBackButton1.classList.add("hidden");
    });

    elJoinButton.addEventListener("click", function(event) {
        elJoinGameForm.classList.remove("hidden");
        elStartButton.classList.add("hidden");
        elJoinButton.classList.add("hidden");
        elBackButton2.classList.remove("hidden");
    });

    elBackButton2.addEventListener("click", function(event) {
        elJoinGameForm.classList.add("hidden");
        elStartButton.classList.remove("hidden");
        elJoinButton.classList.remove("hidden");
        elBackButton2.classList.add("hidden");
    });

    elJoinGameForm.addEventListener("submit", function(event) {
        event.preventDefault();
        elJoinGameBtn.disabled = true;
        elJoinGameForm.disabled = true;
        elBackButton2.disabled = true;
        const formData = new FormData(event.target);
        joinGame(formData);
    });
}


document.addEventListener("DOMContentLoaded", setupPage);
