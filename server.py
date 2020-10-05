from flask import Flask, jsonify, request
import game

app = Flask(__name__)
game_manager = game.GameManager()


@app.route('/')
def landing_page():
    return 'Elijah Landing Page HTML'


# When the player clicks "Create Room" they call the api/game and then the returned game_id
# is used to route them to /waiting_room/<game_id>
@app.route('/api/game', methods=["POST"])
def create_game():
    # TODO: Javascript: sends name of p1
    """
    Request:
    {
        "p1_name": player name string,
    }

    Response:
    {
        "game_id": the integer ID of the created game.
        "player_id": the integer ID of the player
    }
    """
    # Validation Process
    payload = request.get_json()
    p1_name = payload.get("p1_name")
    if p1_name is None or not isinstance(p1_name, str):
        return jsonify({"error":"Invalid player name"}), 401

    # Create Game & Player
    game = game_manager.create_game()
    player = game.add_player(p1_name)
    player_id = player.id()
    return jsonify({
        "game_id": game.get_id(),
        "player_id":player_id,
    })


@app.route('/api/game/<int:game_id>/player', methods=["POST"])
def join_game(game_id: int):
    """
    Request:
    {
        "player_name" : player name string
    }

    Response:
    {
        "player_id": the integer ID of the player
    }
    """
    # Validation Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Invalid Room Number"}), 404

    payload = request.get_json()
    player_name = payload.get("player_name")
    if player_name is None or not isinstance(player_name, str):
        return jsonify({"error":"Invalid player name"}), 401

    # Add player & get information
    player = game.add_player(player_name)
    player_id = player.id()

    return jsonify({"player_id":player_id})


@app.route('/waiting_room/<int:game_id>')
def waiting_room(game_id: int):
    # TODO: JAVASCRIPT: when button is pressed calls /api/game and then redirects here
    return 'Elijah Waiting Room HTML'


@app.route('/api/game/<int:game_id>/player/<int:player_id>', methods=["GET"])
def get_player_information(game_id: int, player_id: int):
    """
    Response:
    {
        "player_name": str of player name
        "player_id": int of player id
        "player_no": int of player number
        "points": int of player points
        "avatar": filename of player avatar
    }
    """
    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Room Not Found"}), 404

    player = game.get_players().get(player_id)
    if not player:
        return jsonify({"error":"Player Not Found"}), 404

    # Return information
    return jsonify(player.to_json())






