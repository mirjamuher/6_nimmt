"""
Step 0: Setting it up
"""
import random
import glob
from typing import List, Dict, Optional, Union, Tuple


BASE_DECK = {
    2: [5, 15, 25, 35, 45, 65, 75, 85, 95],
    3: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    5: [11, 22, 33, 44, 66, 77, 88, 99],
    7: [55],
}

INVERTED_BASE_DECK = {}
for ochsen_value, card_value_list in BASE_DECK.items():
    for card_value in card_value_list:
        INVERTED_BASE_DECK[card_value] = ochsen_value
for i in range(1, 105):
    INVERTED_BASE_DECK.setdefault(i, 1)


class GameManager:
    """
    Keeps track of all games that the server is running
    """
    def __init__(self):
        self._games = {}   # {game_id : Game Object}

    def create_game(self, *, game_id: Optional[int] = None) -> "Game":
        if game_id is None:
            game_id = self.create_game_id()
        game = Game(game_id)
        self._games[game_id] = game
        return game

    def create_game_id(self) -> int:
        while True:
            game_id = random.randint(100000, 999999)
            if game_id not in self._games:
                return game_id

    def get_games(self) -> Dict[int, "Game"]:
        return self._games

    def get_game(self, game_id: int) -> Optional["Game"]:
        return self._games.get(game_id)

    def delete_game(self, game_id: int) -> bool:
        """
        Deletes game associated with game_id. If Game doesn't exist, returns False
        """
        return self._games.pop(game_id, None) is not None


class Card:
    """
    Card Object, storing value and number of Hornochsen
    """
    _value: int
    _ochsen: int
    _player: Optional['Player']

    def __init__(self, value: int, player: Optional['Player'] = None): # TODO: parameter ochsen removed, fix Testcode
        if not isinstance(value, int):
            raise ValueError("Cardvalue should be an int")
        if player is not None and not isinstance(player, Player):
            raise ValueError("Player should be a Player object")
        self._value = value
        self._ochsen = INVERTED_BASE_DECK[self._value]
        self._player = None

    def __repr__(self):  # pragma: nocover
        return f"[Card {self._value}|{self._ochsen}|{self._player}]"

    def __hash__(self):
        return hash(self._value)

    def __lt__(self, other):
        return self._value < other._value

    def __eq__(self, other):
        return self._value == other._value

    def value(self):
        return self._value

    def ochsen(self):
        return self._ochsen

    def assign_player(self, player: 'Player') -> None:
        self._player = player

    def player(self) -> 'Player':
        return self._player


class Player:
    """
    Player class keeps track of id, name, hand, points
    """
    def __init__(self, player_name, player_id, no, avatar):
        self._name = player_name
        self._id = player_id
        self._no = no
        self._current_points = 0
        self._total_points = 0
        self._avatar = avatar
        self._hand = []
        self._selected_card = None

    def name(self) -> str:
        return self._name

    def id(self) -> int:
        return self._id

    def no(self) -> int:
        return self._no

    def current_points(self) -> int:
        return self._current_points

    def total_points(self) -> int:
        return self._total_points

    def hand(self) -> List[Card]:
        return sorted(self._hand)

    def avatar(self) -> str:
        return self._avatar

    def to_json(self):
        return {
            "player_name": self._name,
            "player_id": self._id,
            "player_no": self._no,
            "current_points": self._current_points,
            "total_points": self._total_points,
            "avatar": self._avatar,
        }

    def is_card_in_hand(self, card):
        return card in self._hand

    def clean_hand(self):
        self._hand = []
        self._selected_card = None

    def deal_hand(self, card: Union[Card, List[Card]]) -> None:
        if isinstance(card, Card):
            self._hand.append(card)
            card.assign_player(self)
        elif isinstance(card, list):
            self._hand.extend(card)
            for c in card:
                c.assign_player(self)

    def select_card(self, card: Card) -> None:
        i = self._hand.index(card)
        keep_card = self._hand.pop(i)
        self._selected_card = keep_card

    def is_card_selected(self) -> bool:
        if self._selected_card is None:
            return False
        else:
            return True

    def get_selected_card(self) -> Card:
        return self._selected_card

    def clear_selected_card(self) -> None:
        self._selected_card = None

    def eat_points(self, points: int) -> None:
        self._current_points += points

    def merge_points(self) -> None:
        self._total_points += self._current_points
        self._current_points = 0


class Game:
    """
    Game Object. Made per game started.
    Keeps track of no of players, their hands, and the four stacks on the table
    # 1: Initialise Game - Game()
    # 2: Add players until all players are present - add_player(name)
    # 3: Start game - game_start()
    # 4: Each player choses what card to play - select_card(player_id, card); triggers enter_round
    """
    _player_objects: List[Player]
    _players: Dict[int, Player]
    _stacks: List[List[Card]]
    _state: str
    _game_id: int
    _avatars: list

    def __init__(self, game_id: int):
        self._game_id = game_id
        self._player_objects: List[Player] = []  # [ Player, ...]
        self._players = {}  # {player id : Player, ...}
        self._all_avatars = ['/' + path for path in glob.glob("static/images/test_avatars/*")]

        self._stacks = [[], [], [], []]  # [ Card ]
        self._state = "waiting"

    def get_id(self) -> int:
        return self._game_id

    def get_state(self) -> str:
        return self._state

    def get_nplayers(self) -> int:
        return len(self._player_objects)

    def get_player_hands(self) -> Dict[int, List[Card]]:
        return {player.id(): player.hand() for player in self._player_objects}

    def get_stacks(self) -> List[Card]:
        return self._stacks

    def get_player_list(self):
        return self._player_objects

    def get_players(self):
        return self._players

    def to_json(self):
        return {
            "id": self._game_id,
            "players": [player.to_json() for player in self._player_objects],
            "state": self._state,
        }

    def get_points(self) -> List[Tuple[Player, int]]:
        player_points = [(p, p.total_points()) for p in self._player_objects]
        return sorted(player_points, key = lambda pair: (pair[1], pair[0].no()))

    def add_player(self, player_name: str, *, player_id: Optional[int] = None) -> Player:
        # Need to make each player, including p1 enter their name and thus call this API
        if player_id is None:
            player_id = self.create_player_id()
        avatar = self.assign_avatar()
        new_player = Player(player_name, player_id, len(self._players) + 1, avatar)
        self._player_objects.append(new_player)
        self._players[player_id] = new_player
        return new_player

    def create_player_id(self) -> int:
        while True:
            new_id = random.randint(100000, 999999)
            if new_id not in self._players:
                return new_id

    def assign_avatar(self) -> str:
        self._all_avatars = random.sample(self._all_avatars, k=len(self._all_avatars))
        return self._all_avatars.pop()

    def game_start(self) -> None:
        """
        Activated when p1 presses the "play" button, indicating that all participants have logged in.
        Creates & shuffles deck and deals cards to all players as well as to stacks
        """
        self._state = "dealing"
        deck = self.create_deck()
        self.deal_cards(deck)

    def create_deck(self) -> List[Card]:
        """
        Creates DECK full of Card-Objects
        Creates Set of 1-104 and thus assigns Card objects with just one Ochse
        """
        deck = []
        for card_number in INVERTED_BASE_DECK:
            deck.append(Card(card_number))
        random.shuffle(deck)
        return(deck)

    def deal_cards(self, deck: List[Card]) -> None:
        """
        Deals each player 10 cards and adds one card to each stack
        """
        for player in self._player_objects:
            for _ in range(10):
                crnt_card = deck.pop()
                player.deal_hand(crnt_card)

        for stack in self._stacks:
            stack.append(deck.pop())
        self._stacks.sort(key = lambda stack: stack[0].value())

        self.waiting()

    def get_hand(self, player_id: int) -> List[Card]:
        """
        TODO: Once Cards have been dealt, each client will ask for their cards
        """
        if player_id not in self._players:
            raise ValueError("This player does not exist")
        player = self._players[player_id]
        return player.hand()

    def waiting(self):
        """
        TODO: Ask players to select cards
        """
        self._state = "Between Rounds"

        # If all players have empty hands, we continue to .between_games()
        if any([player.hand() == [] for player in self._player_objects]):
            if not all([player.hand() == [] for player in self._player_objects]):  # pragma: nocover
                raise ValueError("Some players have cards, others don't. This shouldn't happen.")
            self.between_games()

    def select_card(self, player_id: int, card: Card) -> None:
        if player_id not in self._players:
            raise ValueError("This player does not exist")

        player = self._players[player_id]

        if player.is_card_selected():
            raise PlayerAlreadyPlayedError("This player has already played a card")

        self._state = "Selecting Cards"
        player.select_card(card)

        # when everyone has selected a card, we move onto the round (game.enter_round())
        if all([p.is_card_selected() for p in self._player_objects]):
            self._state = "All Cards Selected"
            self.enter_round()

    def enter_round(self):
        """
        TODO when going online, add API that asks how many & which selected cards
        TODO sort selected cards and play them onto stacks and award points and all that jazz
        """
        self._state = "Round in Progress"
        slct_card_stack = sorted(self.get_selected_cards())

        for card in slct_card_stack:
            print('*' * 80)
            print('Processing card', card)
            print('_stacks is', self._stacks)

            if self.is_lowest_card(card):
                # If the card is the lowest card, we first have to replace a stack with it
                min_ochsen = float("inf")
                min_stack = None
                for stack in self.get_stacks():
                    ochsen = sum(card.ochsen() for card in stack)
                    if ochsen < min_ochsen:
                        min_ochsen = ochsen
                        min_stack = stack
                crnt_player = card.player()
                crnt_player.eat_points(min_ochsen)
                self._stacks.remove(min_stack)
                crnt_stack = [card]
                self._stacks.insert(0, crnt_stack)
                print('lowest card has been replaced. stacks are now', self._stacks)

            else:
                # Closest stack is identified and card appended to it
                crnt_stack = self.find_closest_stack(card)
                crnt_stack_index = self._stacks.index(crnt_stack)
                crnt_stack.append(card)
                print('added to stack index', crnt_stack_index, 'stacks are now', self._stacks)

            # If the stack now has 6 cards, player has to eat it
            if len(crnt_stack) == 6:
                print('stack is too large. eating')
                new_first_card = crnt_stack.pop()
                crnt_player = new_first_card.player()
                self.eat_points(crnt_stack, crnt_player)
                self._stacks.remove(crnt_stack)
                self._stacks.insert(crnt_stack_index, [new_first_card])
                print('stacks are now', self._stacks)

            if self._stacks != sorted(self._stacks, key = lambda stack: stack[-1].value()):  # pragma: nocover
                raise ValueError("Stacks are not correctly sorted anymore")

            # TODO: TEST THE SHIT OUT OF EVERYTHING

        for p in self._player_objects:
            p.clear_selected_card()

        self.waiting()

    def get_selected_cards(self) -> List[Card]:
        slct_card_stack = [p.get_selected_card() for p in self._player_objects]
        return slct_card_stack

    def is_lowest_card(self, card: Card) -> bool:
        # Checks the lowest stack's latest card's value against crnt card's value
        return self._stacks[0][-1].value() > card.value()

    def find_closest_stack(self, card: Card) -> List[Card]:
        for stack in reversed(self._stacks):
            print(f'{card} > {stack[-1]}')
            if card.value() > stack[-1].value():
                print('returning', stack)
                return stack
        raise ValueError(f"Card is lower than all stacks. This shouldn't happen. Card: {card}, Stacks: {self._stacks}")  # pragma: nocover

    def eat_points(self, crnt_stack, crnt_player) -> None:  # crnt_stack: List(Card) chucked error
        points = sum([card.ochsen() for card in crnt_stack])
        crnt_player.eat_points(points)

    def between_games(self):
        # TODO: Set up for starting player to chose how many points to play to. Default: 100
        self._state = "Between Games"
        for player in self._player_objects:
            player.merge_points()
        point_list = self.get_points()

        # If one player has reached 100 points, the game is done
        if any(points >= 100 for _, points in point_list):
            self.end_of_game(point_list)
        else:
            self.clean_slate()
            self.game_start()

    def clean_slate(self):
        self._stacks = [[], [], [], []]
        for player in self._player_objects:
            player.clean_hand()

    def end_of_game(self, point_list: List[Tuple[Player, int]]):
        # TODO: Announce winner, confetti, all that jazz
        self._state = "End of Game"


class PlayerAlreadyPlayedError(Exception):
    """
    This is a specific excpetion
    This is an exception indicating that the player already played a card
    To prevent generic ValueError
    """
