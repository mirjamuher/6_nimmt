import unittest
from unittest.mock import patch

from game import Card, Game, Player


class TestCard(unittest.TestCase):
    TEST_ID = 000000
    TEST_PLAYER_NUMBER = 2
    AVATAR = "test.jpg"
    TEST_PLAYER = Player("Miri", TEST_ID, TEST_PLAYER_NUMBER, AVATAR)

    CARD_STARTSET = [Card(1), Card(10), Card(100)]

    def test_equal(self):
        c1 = Card(4)
        c2 = Card(4)
        self.assertEqual(c1, c2)

        c1 = Card(100)
        c2 = Card(100)
        self.assertEqual(c1, c2)

        c1 = Card(104)
        c2 = Card(100)
        self.assertNotEqual(c1, c2)

    def test_less_than(self):
        c1 = Card(5)
        c2 = Card(20)
        self.assertLess(c1, c2)

    def test_ochsen(self):
        c = Card(4)
        self.assertEqual(1, c.ochsen())

        c = Card(55)
        self.assertEqual(7, c.ochsen())

    def test_player(self):
        c = Card(4)
        c.assign_player(self.TEST_PLAYER)
        self.assertEqual(c.player(), self.TEST_PLAYER)


class TestPlayer(unittest.TestCase):
    TEST_ID = 000000
    TEST_PLAYER_NUMBER = 2
    AVATAR = "test.jpg"
    CARD_STARTSET = [Card(1), Card(10), Card(100)]
    TEST_PLAYER = Player("Miri", TEST_ID, TEST_PLAYER_NUMBER, AVATAR)

    def test_attributes(self):
        p1 = self.TEST_PLAYER
        self.assertEqual(p1.name(), 'Miri')
        self.assertEqual(p1.id(), self.TEST_ID)
        self.assertEqual(p1.no(), self.TEST_PLAYER_NUMBER)
        self.assertEqual(p1.total_points(), 0)
        self.assertEqual(p1.hand(), [])
        self.assertFalse(p1.is_card_selected())

    def test_hand(self):
        p1 = self.TEST_PLAYER
        for card in self.CARD_STARTSET:
            p1.deal_hand(card)
        self.assertTrue(p1.hand(), self.CARD_STARTSET)
        p1.select_card(Card(10))
        self.assertTrue(p1.hand(), [Card(1), Card(100)])
        self.assertTrue(p1.is_card_selected())

    def test_eat_points(self):
        TEST_POINTS = 5
        p1 = self.TEST_PLAYER
        p1.eat_points(TEST_POINTS)
        self.assertEqual(p1.current_points(), TEST_POINTS)
        p1.eat_points(TEST_POINTS)
        self.assertEqual(p1.current_points(), 2 * TEST_POINTS)
        self.assertEqual(p1.total_points(), 0)

    def test_clean_hand(self):
        p1 = self.TEST_PLAYER
        p1.deal_hand(self.CARD_STARTSET)a
        self.assertEqual(p1.hand(), self.CARD_STARTSET)
        p1.select_card(Card(1))
        self.assertEqual(p1.get_selected_card(), Card(1))
        p1.clean_hand()
        self.assertEqual(p1.hand(), [])
        self.assertIsNone(p1.get_selected_card())


class TestGame(unittest.TestCase):
    RC = 111111  # Room Code

    def test_game_setup_state(self):
        g1 = Game(self.RC)
        self.assertEqual(0, g1.get_nplayers())
        self.assertEqual("waiting", g1.get_state())

    def test_add_player(self):
        """
        Test a basic setup with two players, different names
        """
        g1 = Game(self.RC)
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
        g1 = Game(self.RC)
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

            g1 = Game(self.RC)
            for name in player_names:
                g1.add_player(name)

            # Sanity check that our players got our fake player IDs.
            for i in range(len(player_names)):
                self.assertEqual(i, g1._player_objects[i].id())

            return g1

    def test_game_start(self):
        with patch.object(Game, 'waiting'):
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
        for _, hand in g1.get_player_hands().items():
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
        p0_card = Card(404)
        with self.assertRaisesRegex(ValueError, "This player does not exist"):
            g1.select_card(p0_id, p0_card)

        p1 = g1.get_player_list()[0]
        p1_id = p1.id()
        p1_card = p1.hand()[0]
        g1.select_card(p1_id, p1_card)
        with self.assertRaisesRegex(ValueError, "This player has already played. Your choice is final."):
            g1.select_card(p1_id, Card(404))

    def test_find_closest_stack(self):
        g1 = self._setup_game(["Miri"])

        STACKS = [[Card(10)], [Card(25)], [Card(50)], [Card(100)]]
        g1._stacks = STACKS

        p1 = g1.get_player_list()[0]

        p1.deal_hand([Card(11), Card(12), Card(13), Card(51), Card(101)])

        # Test Case 1. Expected: [Card(10), Card(11)], [Card 25], [Card(50)], [Card(100)]
        g1.select_card(p1.id(), Card(11))
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(10), Card(11)], f"{stack}")
            else:
                self.assertEqual(len(stack), 1, f"{stack}")

        # Test Case 2. Expected: [Card(10), Card(11)], [Card 25], [Card(50), Card(51)], [Card(100)]
        g1.select_card(p1.id(), Card(51))
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(10), Card(11)], f"{stack}")
            elif i == 2:
                self.assertEqual(len(stack), 2, f"{stack}")
                self.assertListEqual(stack, [Card(50), Card(51)], f"{stack}")
            else:
                self.assertEqual(len(stack), 1, f"{stack}")

    def _setup_game_controlled_variables(self):
        """
        Sets up Game g1 with the players "Miri" id 0, "Tim" id 1 and "Elijah" id 2
        Deals them the cards specified below.
        Intended for testing of all instances of gamestate Round in Progress
        """
        g1 = self._setup_game()

        STACKS = [[Card(10)], [Card(25)], [Card(50)], [Card(100)]]
        g1._stacks = STACKS

        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        p1.deal_hand([Card(1), Card(11), Card(14), Card(17), Card(20)])
        p2.deal_hand([Card(2), Card(12), Card(15), Card(18), Card(30)])
        p3.deal_hand([Card(3), Card(13), Card(16), Card(19), Card(31)])

        return g1

    @patch.object(Game, 'between_games')
    def test_enter_round(self, mocked_beween_games):
        g1 = self._setup_game_controlled_variables()
        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        # ROUND 1: All players play a card. No points eaten, no stacks changed
        g1.select_card(p1.id(), Card(11))
        g1.select_card(p2.id(), Card(12))
        g1.select_card(p3.id(), Card(13))
        mocked_beween_games.assert_not_called()

            # are all stacks appended correctly?
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 4)
                continue
            self.assertEqual(len(stack), 1)

            # are the cards in stack 1 correct?
        self.assertEqual(g1.get_stacks()[0], [Card(10), Card(11), Card(12), Card(13)])
        self.assertFalse(all([p.is_card_selected() for p in g1.get_player_list()]))
        self.assertEqual(g1.get_state(), "Between Rounds")

        # ROUND 2: All players play. Player 2 eats Stack 1.
        # Expected: [()]
        g1.select_card(p1.id(), Card(14))
        g1.select_card(p2.id(), Card(15))
        g1.select_card(p3.id(), Card(16))
        mocked_beween_games.assert_not_called()

            # are all stacks appended correctly?
        for i, stack in enumerate(g1.get_stacks()):
            if i == 0:
                self.assertEqual(len(stack), 2)
                continue
            self.assertEqual(len(stack), 1)

            # are the cards in the stacks correct?
        self.assertListEqual(g1.get_stacks()[0], [Card(15), Card(16)])
        self.assertListEqual(g1.get_stacks()[1], [Card(25)])
        self.assertListEqual(g1.get_stacks()[2], [Card(50)])
        self.assertListEqual(g1.get_stacks()[3], [Card(100)])

            # did player 2 eat the points?
        for i, player in enumerate(g1.get_player_list()):
            if i == 1:
                self.assertEqual(player.points(), 5)
                continue
            self.assertEqual(player.points(), 0)

        # ROUND 3: All players play, one plays the lowest card
        # p1 should eat 1 point and Card 25 should be replaced
        # after: p1: 1 point, p2: 5 points, p3: 0 points
        # after: stack 1: Card(1), Card(3) stack 2: Card(15), Card(16), Card(18), Stack 3: Card(50), Stack 4: Card(100)
        g1.select_card(p1.id(), Card(1))
        g1.select_card(p2.id(), Card(18))
        g1.select_card(p3.id(), Card(3))
        mocked_beween_games.assert_not_called()

            # did the stacks get replaced and added to correctly?
        self.assertEqual(len(g1.get_stacks()[0]), 2, f"{stack}")
        self.assertListEqual(g1.get_stacks()[0], [Card(1), Card(3)])
        self.assertEqual(len(g1.get_stacks()[1]), 3)
        self.assertListEqual(g1.get_stacks()[2], [Card(50)])
        self.assertEqual(len(g1.get_stacks()[3]), 1)

            # did player 1 eat a point?
        self.assertEqual(p1.points(), 1)
        self.assertEqual(p2.points(), 5)
        self.assertEqual(p3.points(), 0)

        # ROUND 4: Sanity check - play another low card and keep adding to stacks
        # Player 2 should eat 1 point and Stack(Card(50)) replaced
        # after: [Card 2], [Card(1), Card(3), Card(17)], [Card(15), Card(16), Card(18), Card(19)], [Card 100]
        g1.select_card(p1.id(), Card(17))
        g1.select_card(p2.id(), Card(2))
        g1.select_card(p3.id(), Card(19))
        mocked_beween_games.assert_not_called()

            # did the stacks get replaced and added to correctlY?
        self.assertListEqual(g1.get_stacks()[0], [Card(2)])
        self.assertListEqual(g1.get_stacks()[1], [Card(1), Card(3), Card(17)])
        self.assertListEqual(g1.get_stacks()[2], [Card(15), Card(16), Card(18), Card(19)])
        self.assertListEqual(g1.get_stacks()[3], [Card(100)])

            # Did player 2 eat 1 point?
        self.assertEqual(p1.points(), 1)
        self.assertEqual(p2.points(), 6)
        self.assertEqual(p3.points(), 0)
#
        # LAST ROUND: Sanity check continues, end of game reached
        # Player 2 should eat 5 points to 11
        # after: [Card(2)], [Card(1), Card(3), Card(17)], [Card(30), Card(31)], [Card(100)]
        g1.select_card(p1.id(), Card(20))
        g1.select_card(p2.id(), Card(30))
        g1.select_card(p3.id(), Card(31))
        mocked_beween_games.assert_called_once_with()

            # did the stacks get replaced correctly?
        self.assertListEqual(g1.get_stacks()[0], [Card(2)])
        self.assertListEqual(g1.get_stacks()[1], [Card(1), Card(3), Card(17)])
        self.assertListEqual(g1.get_stacks()[2], [Card(30), Card(31)])
        self.assertListEqual(g1.get_stacks()[3], [Card(100)])

            # Did player 2 eat 5 points?
        self.assertEqual(p1.points(), 1)
        self.assertEqual(p2.points(), 11)
        self.assertEqual(p3.points(), 0)

            # Are all hands empty now?
        self.assertListEqual(p1.hand(), [])
        self.assertListEqual(p2.hand(), [])
        self.assertListEqual(p3.hand(), [])

            # Has the game ended correctly?
        self.assertEqual(g1.get_state(), "Between Rounds")

    def test_points(self):
        g1 = self._setup_game_controlled_variables()
        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        #Testing eating points
        p1.eat_points(5)
        p2.eat_points(10)
        p3.eat_points(15)

        points_list = g1.get_current_points()
        self.assertEqual(points_list, [(p1, 5), (p2, 10), (p3, 15)])

        #Testing merging points
        p1.merge_points()
        p2.merge_points()
        p3.merge_points()

        points_list = g1.get_total_points()
        self.assertEqual(points_list, [(p1, 5), (p2, 10), (p3, 15)])

        #Testing eaten points back to 0 now
        points_list = g1.get_current_points()
        self.assertEqual(points_list, [(p1, 0), (p2, 0), (p3, 0)])


    @patch.object(Game, "game_start")
    def test_between_games(self, mocked_game_start):
        g1 = self._setup_game_controlled_variables()
        p1 = g1.get_player_list()[0]
        p2 = g1.get_player_list()[1]
        p3 = g1.get_player_list()[2]

        # V1: no player has >= 100 points, next round commences
        p1.eat_points(99)
        g1.between_games()
        self.assertEqual(g1.get_stacks(), [[], [], [], []])
        self.assertEqual(p1.hand(), [])
        mocked_game_start.assert_called_once_with()

        # V2: one player has 100 points, end of game called
        p1.eat_points(1)
        g1.between_games()
        self.assertEqual(g1.get_state(), 'End of Game')

        # V3: multiple player have > 100 points, end of game called
        p1._points = 0
        p1.eat_points(5)
        p2.eat_points(101)
        p3.eat_points(150)

        points_list = g1.get_points()
        self.assertEqual(points_list, [(p1, 5), (p2, 101), (p3, 150)])
        g1.between_games()
        self.assertEqual(g1.get_state(), 'End of Game')
