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
    request_domain = request.url_root
    return render_template('skeleton/landing_page.html', request_domain=request_domain)


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
        return "Game Not Found. Perhaps you were idle for too long?", 404

    player = game.get_players().get(player_id)
    if not player:
        return "Player Not Found", 404

    return render_template('skeleton/game_room.html', game=game, player=player)


# Inbetween Games Room
@app.route('/inbetween_rounds/<int:game_id>/<int:player_id>')
def inbetween_games(game_id: int, player_id: int):
    # Validation Process
    game = game_manager.get_game(game_id)
    if not game:
        return "Game Not Found", 404

    player = game.get_players().get(player_id)
    if not player:
        return "Player Not Found", 404

    return render_template('skeleton/inbetween_games.html', game=game, player=player)

# End Game Room
@app.route('/end_of_game/<int:game_id>/<int:player_id>')
def end_of_game(game_id: int, player_id: int):
    # Validation Process
    game = game_manager.get_game(game_id)
    if not game:
        return "Game Not Found", 404

    player = game.get_players().get(player_id)
    if not player:
        return "Player Not Found", 404

    return render_template('skeleton/end_of_game.html', game=game, player=player)


"""
API VIEWS - speak json
"""
# When the player clicks "Create Room" they call the api/game and then the returned game_id
# is used to route them to /waiting_room/<game_id>
@app.route('/api/game', methods=["POST"])
def create_game():
    """
    Request:
    {
        "p1_name": player name string,
        "end_points": str of points to play to
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

    point_goal = payload.get("end_points")
    if not point_goal or not isinstance(point_goal, str):
        return jsonify({"error":"Invalid Point Goal / End Points"}), 400

    # Create Game & Player
    game = game_manager.create_game()
    player = game.add_player(p1_name)
    player_id = player.id()

    # Add the point goal
    game.set_point_goal(point_goal)

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
        "player_id": the integer ID of the player,
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

    # Check if max number of players (10) has already been reached
    max_players = game.get_max_players()
    n_players = game.get_nplayers()
    if n_players == max_players:
        return jsonify({"error": "The max number of players for this room has already been reached"}), 400

    # Add player & get information
    player = game.add_player(player_name)
    player_id = player.id()

    return jsonify({"player_id": player_id})


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

# Moves game state from "Between Games" to "End of Game"
@app.route('/api/game/<int:game_id>/end', methods=["POST"])
def end_game(game_id: int):
    # Validation Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Invalid Room Number"}), 404

    # Activating game.end_of_game()
    game.end_of_game()

    # Return Information
    return jsonify(game.to_json())

@app.route('/api/game/<int:game_id>', methods=["GET"])
def get_game_information(game_id: int):
    """
    ZF: Returns information about every game; player info can get extracted
    Response:
    {
        "id": game id,
        "players": [player data as per API get_player_information],
        "n_players": number of players in the game,
        "max_players": max amount of players (set to 10),
        "state": game state string,
        "stacks": [[Card, Optional[Card],...][-"-][-"-][-"-]],
    }
    # Card: {"value": cardvalue, "ochsen": ochsen}
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
    ZF: Returns information about the individual player
    Response:
    {
        "player_name": str of player name
        "player_id": int of player id
        "player_no": int of player number
        "current_points" : self._current_points,
        "total_points": int of player points
        "last_eaten_points": str of last eaten points or empty
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


@app.route('/api/game/<int:game_id>/player/<int:player_id>/card_selected', methods=["PUT"])
def player_chooses_card(game_id: int, player_id: int):
    """
    ZF: Player's chosen card gets send to server
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
    # Validating Process
    game = game_manager.get_game(game_id)
    if not game:
        return jsonify({"error":"Room Not Found"}), 404

    if not game.has_notation_round(round_number):
        return jsonify({
            "everyone_played": False,
            "data": None,
        })

    current_round_notation = game.get_notation_round(round_number)

    # If this round notation exists, everyone has played. Return round notation.
    return jsonify({
        "everyone_played": True,
        "data": current_round_notation.to_json(),
    })



"""
TEST GAME
http://127.0.0.1:5000/game/123456/1
"""
# Setup Game
import random  # noQA: E402
random.seed(0)
TEST_GAME = game_manager.create_game(game_id=123456)
TEST_GAME.set_point_goal(80)
test_miri = TEST_GAME.add_player("Miri", player_id=1)
test_tim = TEST_GAME.add_player("Tim", player_id=2)
test_elijah = TEST_GAME.add_player("Elijah", player_id=3)
TEST_GAME.game_start()

# Get Card information from players
player_hands = TEST_GAME.get_player_hands()
miri_hand = player_hands[1]
tim_hand = player_hands[2]
elijah_hand = player_hands[3]

# Assign already points to players
test_miri._total_points = 20
test_tim._total_points = 15
test_elijah._total_points = 5

# Move Game to Endstage
for i in range(5):
    TEST_GAME.select_card(1, miri_hand.pop())
    TEST_GAME.select_card(2, tim_hand.pop())
    TEST_GAME.select_card(3, elijah_hand.pop())

if __name__ == '__main__':
    app.run(threaded=True, port=5000)
