# TEST URL: http://127.0.0.1:5000/game/123456/1

from flask import Flask, jsonify, request, render_template
from game import GameManager, Card, PlayerAlreadyPlayedError

app = Flask(__name__)
game_manager = GameManager()

"""
TODO:
1) implement (`/game/${gameID}/${playerID}`)
2) Have error messages return html pages
"""


"""
HTML VIEWS - speak html
"""
# Landing Page
@app.route('/')
def landing_page():
    return render_template('skeleton/landing_page.html')

# Waiting Room
@app.route('/waiting_room/<int:game_id>/<int:player_id>')
def waiting_room(game_id: int, player_id: int):
    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return "Game Not Found", 404

    player = game.get_players().get(player_id)
    if not player:
        return "Player Not Found", 404

    return render_template('skeleton/waiting_room.html', game=game, player=player)

# Play Room
@app.route('/game/<int:game_id>/<int:player_id>')
def play_room(game_id: int, player_id: int):

    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return "Game Not Found", 404

    player = game.get_players().get(player_id)
    if not player:
        return "Player Not Found", 404

    return render_template('skeleton/game_room.html', game=game, player=player)


"""
API VIEWS - speak json
"""
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
    if not p1_name or not isinstance(p1_name, str):
        return jsonify({"error":"Invalid player name"}), 400

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
    if not player_name or not isinstance(player_name, str):
        return jsonify({"error":"Invalid player name"}), 401

    # Add player & get information
    player = game.add_player(player_name)
    player_id = player.id()

    return jsonify({"player_id":player_id})

# Moves game state from "waiting" to "dealing", thus starting the game for everyone
@app.route('/api/game/<int:game_id>/start', methods=["POST"])
def start_game(game_id: int):

    # Validation Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Invalid Room Number"}), 404

    # Activating game.game_start()
    game.game_start()

    # Return Information
    return jsonify(game.to_json())

@app.route('/api/game/<int:game_id>', methods=["GET"])
def get_game_information(game_id: int):
    """
    Response:
    {
        "id": game id,
        "players": [player data as per API get_player_information],
        "state": game state string,
    }
    """
    # TODO: 1) implement to_json in Game
    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Room Not Found"}), 404

    # Return information
    return jsonify(game.to_json())

@app.route('/api/game/<int:game_id>/player/<int:player_id>', methods=["GET"])
def get_player_information(game_id: int, player_id: int):
    """
    Response:
    {
        "player_name": str of player name
        "player_id": int of player id
        "player_no": int of player number
        "current_points" : self._current_points,
        "total_points": int of player points
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


"""
API Views for game_room
"""

@app.route('/api/game/<int:game_id>/player/<int:player_id>/card_selected', methods=["PUT"])
def player_chooses_card(game_id: int, player_id: int):
    """
    Request:
    {
        "selected_card" : int of card number
    }
    """
    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Room Not Found"}), 404

    player = game.get_players().get(player_id)
    if not player:
        return jsonify({"error":"Player Not Found"}), 404

    # Validation of Card
    payload = request.get_json()
    card_number = payload.get("selected_card")
    if not card_number or not isinstance(card_number, str):
        return jsonify({"error":"No Card Selected"}), 400
    if int(card_number) > 104 or int(card_number) < 1:
        return jsonify({"error":"Invalid Card Number"}), 400

    selected_card = Card(int(card_number), player)
    if not player.is_card_in_hand(selected_card):
        return jsonify({"error":"Selected Card is not in Player's Hand"}), 400

    # feed information into game.py
    try:
        game.select_card(player_id, selected_card)
    except PlayerAlreadyPlayedError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({}), 201



"""
TEST GAME
"""
# Setup Game
import random
random.seed(0)
TEST_GAME = game_manager.create_game(game_id=123456)
TEST_GAME.add_player("Miri", player_id=1)
TEST_GAME.add_player("Tim", player_id=2)
TEST_GAME.add_player("Elijah", player_id=3)
TEST_GAME.game_start()

# Test updating of current_points
miri = TEST_GAME.get_players()[1]
miri.eat_points(5)
