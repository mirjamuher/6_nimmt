import unittest
from unittest.mock import patch

from game import Card, Game, Player

# TODO: Tim, where do constants go?
TEST_ID = 000000
TEST_STARTPOINT = 2
CARD_STARTSET = [Card(1, 1), Card(10,5), Card(100, 3)]
TEST_PLAYER = Player("Miri", TEST_ID, TEST_STARTPOINT)


class TestCard(unittest.TestCase):
    def test_equal(self):
        c1 = Card(4, 1)
        c2 = Card(4, 1)
        self.assertEqual(c1, c2)

        c1 = Card(100, 6)
        c2 = Card(100, 6)
        self.assertEqual(c1, c2)

        c1 = Card(104, 1)
        c2 = Card(100, 6)
        self.assertNotEqual(c1, c2)

    def test_less_than(self):
        c1 = Card(5, 3)
        c2 = Card(20, 1)
        self.assertLess(c1, c2)

    def test_ochsen(self):
        c = Card(4, 1)
        self.assertEqual(1, c.ochsen())

        c = Card(6, 3)
        self.assertEqual(3, c.ochsen())

    def test_player(self):
        c = Card(4, 1)
        c.assign_player(TEST_PLAYER)
        self.assertEqual(c.player(), TEST_PLAYER)


class TestPlayer(unittest.TestCase):
    def test_attributes(self):
        p1 = TEST_PLAYER
        self.assertEqual(p1.name(), 'Miri')
        self.assertEqual(p1.id(), TEST_ID)
        self.assertEqual(p1.no(), TEST_STARTPOINT)
        self.assertEqual(p1.points(), 0)
        self.assertEqual(p1.hand(), [])
        self.assertFalse(p1.is_card_selected())

    def test_hand(self):
        p1 = TEST_PLAYER
        for card in CARD_STARTSET:
            p1.deal_hand(card)
        self.assertTrue(p1.hand(), CARD_STARTSET)
        p1.select_card(Card(10,5))
        self.assertTrue(p1.hand(), [Card(1, 1), Card(100, 3)])
        self.assertTrue(p1.is_card_selected())

    def test_eat_points(self):
        TEST_POINTS = 5
        p1 = TEST_PLAYER
        p1.eat_points(TEST_POINTS)
        self.assertEqual(p1.points(), TEST_POINTS)
        p1.eat_points(TEST_POINTS)
        self.assertEqual(p1.points(), 2 * TEST_POINTS)


class TestGame(unittest.TestCase):
    def test_game_setup_state(self):
        g1 = Game()
        self.assertEqual(0, g1.get_nplayers())
        self.assertEqual("waiting", g1.get_state())

    def test_add_player(self):
        """
        Test a basic setup with two players, different names
        """
        g1 = Game()
        player_set = set()
        tim_id = g1.add_player("Tim")
        player_set.add(tim_id)
        self.assertEqual(1, g1.get_nplayers())
        miri_id = g1.add_player("Miri")
        player_set.add(miri_id)
        self.assertEqual(2, g1.get_nplayers())
        self.assertEqual(len(player_set), g1.get_nplayers())

    def test_add_player_complex(self):
        """
        Test a complicated setup with two players, same names
        """
        g1 = Game()
        player_set = set()
        p1_id = g1.add_player("Elijah")
        player_set.add(p1_id)
        p2_id = g1.add_player("Elijah")
        player_set.add(p2_id)
        self.assertEqual(2, g1.get_nplayers())
        self.assertEqual(len(player_set), g1.get_nplayers())

    def _setup_game(self, player_names = ["Tim", "Elijah", "Miri"]):
        """
        XXX: Sets up a mock game for testing
        """
        fake_player_ids = list(range(len(player_names)))

        with patch.object(Game, 'create_player_id') as mocked_create_player_id:
            mocked_create_player_id.side_effect = fake_player_ids

            g1 = Game()
            for name in player_names:
                g1.add_player(name)

            # Sanity check that our players got our fake player IDs.
            for i in range(len(player_names)):
                self.assertEqual(i, g1._player_objects[i].id())

            return g1

    def test_game_start(self):
        g1 = self._setup_game()
        g1.game_start()
        self.assertEqual("dealing", g1.get_state())

    def test_create_deck(self):
        g1 = self._setup_game()
        deck = g1.create_deck()
        set_deck = set(deck)
        self.assertEqual(104, len(set_deck))

    def _setup_and_deal_cards(self):
        """
        XXX: Sets up mock game & deals cards for testing
        """
        g1 = self._setup_game()
        deck = g1.create_deck()
        g1.deal_cards(deck)
        return g1

    def test_deal_cards(self):
        g1 = self._setup_and_deal_cards()
        all_set = set()
        no_of_cards = 0
        for player, hand in g1.get_player_hands().items():
            check_hand = set(hand)
            self.assertEqual(10, len(hand))
            self.assertEqual(10, len(check_hand))
            all_set.update(check_hand)
            no_of_cards += len(hand)

        for stack in g1.get_stacks():
            self.assertEqual(1, len(stack))
            all_set.update(stack)
            no_of_cards += len(stack)

        self.assertEqual(no_of_cards, len(all_set))

    def test_get_hand(self):
        # sets up game and gets out all variables we need
        g1 = self._setup_and_deal_cards()
        p1 = g1.get_player_list()[0]
        p1_id = p1.id()
        self.assertEqual(g1.get_hand(p1_id), p1.hand())

    def test_faulty_get_hand(self):
        """
        Tests getting the hand of a palyer that is not registered in the game
        """
        g1 = self._setup_and_deal_cards()
        p1_id = 404
        with self.assertRaisesRegex(ValueError, "This player does not exist"):
            g1.get_hand(p1_id)

    def _setup_game_deal_cards_players_select_cards(self):
        # sets up game and gets out all variables we need
        g1 = self._setup_and_deal_cards()
        p1 = g1.get_player_list()[0]
        p1_card = p1.hand()[0]
        p2 = g1.get_player_list()[1]
        p2_card = p2.hand()[0]
        p3 = g1.get_player_list()[2]
        p3_card = p3.hand()[0]
        return [g1, p1, p1_card, p2, p2_card, p3, p3_card]

    def test_select_card(self):
        with patch.object(Game, 'enter_round') as mocked_enter_round:
            g1, p1, p1_card, p2, p2_card, p3, p3_card = self._setup_game_deal_cards_players_select_cards()
            g1.select_card(p1.id(), p1_card)
            mocked_enter_round.assert_not_called()
            self.assertEqual(g1.get_state(), "Selecting Cards")

            # If everyone has selected a card, we should enter gamestate "All Cards Selected"
            g1.select_card(p2.id(), p2_card)
            mocked_enter_round.assert_not_called()
            g1.select_card(p3.id(), p3_card)
            mocked_enter_round.assert_called_once_with()
            self.assertEqual(g1.get_state(), "All Cards Selected")

    def test_faulty_select_card(self):
        """
        Tests ValueErrors with a faulty setup
        """
        g1 = self._setup_and_deal_cards()
        p0_id = 404
        p0_card = Card(404, 4)
        with self.assertRaisesRegex(ValueError, "This player does not exist"):
            g1.select_card(p0_id, p0_card)

        p1 = g1.get_player_list()[0]
        p1_id = p1.id()
        p1_card = p1.hand()[0]
        g1.select_card(p1_id, p1_card)
        with self.assertRaisesRegex(ValueError, "This player has already played. Your choice is final."):
            g1.select_card(p1_id, Card(404, 4))

    def test_find_closest_stack(self):
        g1 = self._setup_game(["Miri"])

        STACKS = [[Card(10,1)], [Card(25,1)], [Card(50,1)], [Card(100,1)]]
        g1._stacks = STACKS

        p1 = g1.get_player_list()[0]

        p1.deal_hand([Card(11, 1), Card(12, 1), Card(13, 1), Card(51, 1), Card(101, 1)])

        # Test Case 1. Expected: [Card(10), Card(11)], [Card 25], [Card(50)], [Card(100)]
        g1.select_card(p1.id(), Card(11, 1))
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(10, 1), Card(11, 1)], f"{stack}")
            else:
                self.assertEqual(len(stack), 1, f"{stack}")

        # Test Case 2. Expected: [Card(10), Card(11)], [Card 25], [Card(50), Card(51)], [Card(100)]
        g1.select_card(p1.id(), Card(51, 1))
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(10, 1), Card(11, 1)], f"{stack}")
            elif i == 2:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(50, 1), Card(51, 1)], f"{stack}")
            else:
                self.assertEqual(len(stack), 1, f"{stack}")

    def _setup_game_controlled_variables(self):
        """
        Sets up Game g1 with the players "Miri" id 0, "Tim" id 1 and "Elijah" id 2
        Deals them the cards specified below.
        Intended for testing of all instances of gamestate Round in Progress
        """
        g1 = self._setup_game()

        STACKS = [[Card(10,1)], [Card(25,1)], [Card(50,1)], [Card(100,1)]]
        g1._stacks = STACKS

        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        p1.deal_hand([Card(1, 1), Card(11, 1), Card(14, 1), Card(17, 1), Card(20, 1), Card(51, 1), Card(101, 1)])
        p2.deal_hand([Card(2, 1), Card(12, 1), Card(15, 1), Card(18, 1), Card(30, 1), Card(52, 1), Card(102, 1)])
        p3.deal_hand([Card(3, 1), Card(13, 1), Card(16, 1), Card(19, 1), Card(31, 1), Card(53, 1), Card(103, 1)])

        return g1

    def test_enter_round(self):
        g1 = self._setup_game_controlled_variables()
        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        # Round 1: All players play a card. No points eaten, no stacks changed
        g1.select_card(p1.id(), Card(11, 1))
        g1.select_card(p2.id(), Card(12, 1))
        g1.select_card(p3.id(), Card(13, 1))

            # are all stacks appended correctly?
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 4)
                continue
            self.assertEqual(len(stack), 1)

            # are the cards in stack 1 correct?
        self.assertEqual(g1.get_stacks()[0], [Card(10, 1), Card(11, 1), Card(12, 1), Card(13, 1)])
        self.assertFalse(all([p.is_card_selected() for p in g1.get_player_list()]))
        self.assertEqual(g1.get_state(), "Between Rounds")

        # Round 2: All players play. Player 2 eats Stack 1.
        # Expected: [()]
        g1.select_card(p1.id(), Card(14, 1))
        g1.select_card(p2.id(), Card(15, 1))
        g1.select_card(p3.id(), Card(16, 1))

            # are all stacks appended correctly?
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2)
                continue
            self.assertEqual(len(stack), 1)

            # are the cards in the stacks correct?
        self.assertListEqual(g1.get_stacks()[0], [Card(15, 1), Card(16, 1)])
        self.assertListEqual(g1.get_stacks()[1], [Card(25, 1)])
        self.assertListEqual(g1.get_stacks()[2], [Card(50, 1)])
        self.assertListEqual(g1.get_stacks()[3], [Card(100, 1)])

            # did player 2 eat the points?
        for i, player in enumerate(g1.get_player_list()):
            if i == 1:
                self.assertEqual(player.points(), 5)
                continue
            self.assertEqual(player.points(), 0)

        # Round 3: All players play, one plays the lowest card
        # p1 should eat 1 point and Card 25 should be replaced
        # after: p1: 1 point, p2: 5 points, p3: 0 points
        # after: stack 1: Card(1), Card(3) stack 2: Card(15), Card(16), Card(18), Stack 3: Card(50), Stack 4: Card(100)
        print('BEGIN 1')
        g1.select_card(p1.id(), Card(1, 1))
        g1.select_card(p2.id(), Card(18, 1))
        g1.select_card(p3.id(), Card(3, 1))
        print('END')

            # did the stacks get replaced and added to correctly?
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(1, 1), Card(3, 1)])
            elif i == 1:
                self.assertEqual(len(stack), 3)
            elif i == 2:
                self.assertEqual(stack[0].value(), 50)
            else:
                self.assertEqual(len(stack), 1)

            # did player 1 eat a point?
        self.assertEqual(p1.points(), 1)
        self.assertEqual(p2.points(), 5)
        self.assertEqual(p3.points(), 0)

        # Round 4: Sanity check - play lowest card and keep adding to stacks
        g1.select_card(p1.id(), Card(1, 1))
        g1.select_card(p1.id(), Card(2, 1))
        g1.select_card(p1.id(), Card(1, 1))
