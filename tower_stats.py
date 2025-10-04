#!/usr/bin/env python3
"""
The Tower Game Statistics Tracker
Parses and stores game statistics from The Tower game.
"""

import re
import json
import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class GameStats:
    """Data structure for storing Tower game statistics."""

    # Basic game info
    game_time: str = ""
    real_time: str = ""
    tier: int = 0
    wave: int = 0
    killed_by: str = ""

    # Currency and resources
    coins_earned: str = ""
    cash_earned: str = ""
    interest_earned: str = ""
    gem_blocks_tapped: int = 0
    cells_earned: str = ""
    reroll_shards_earned: str = ""

    # Damage statistics
    damage_taken: str = ""
    damage_taken_wall: str = ""
    damage_taken_while_berserked: str = ""
    damage_gain_from_berserk: str = ""
    death_defy: int = 0
    damage_dealt: str = ""

    # Combat statistics
    projectiles_damage: str = ""
    rend_armor_damage: str = ""
    projectiles_count: str = ""
    lifesteal: int = 0
    thorn_damage: str = ""
    orb_damage: str = ""
    orb_hits: str = ""
    land_mine_damage: str = ""
    land_mines_spawned: int = 0
    death_ray_damage: str = ""
    smart_missile_damage: str = ""
    inner_land_mine_damage: str = ""
    chain_lightning_damage: str = ""
    death_wave_damage: str = ""
    swamp_damage: str = ""
    black_hole_damage: str = ""

    # Progression statistics
    waves_skipped: int = 0
    recovery_packages: int = 0
    free_attack_upgrade: int = 0
    free_defense_upgrade: int = 0
    free_utility_upgrade: int = 0

    # Death Wave bonuses
    hp_from_death_wave: str = ""
    coins_from_death_wave: str = ""

    # Special income sources
    cash_from_golden_tower: str = ""
    coins_from_golden_tower: str = ""
    coins_from_blackhole: str = ""
    coins_from_spotlight: str = ""
    coins_from_orbs: str = ""
    coins_from_coin_upgrade: str = ""
    coins_from_coin_bonuses: str = ""

    # Enemy statistics
    total_enemies: int = 0
    basic: int = 0
    fast: int = 0
    tank: int = 0
    ranged: int = 0
    boss: int = 0
    protector: int = 0
    total_elites: int = 0
    vampires: int = 0
    rays: int = 0
    scatters: int = 0
    saboteurs: int = 0
    commanders: int = 0
    overcharges: int = 0

    # Destruction methods
    destroyed_by_orbs: int = 0
    destroyed_by_thorns: int = 0
    destroyed_by_death_ray: int = 0
    destroyed_by_land_mine: int = 0

    # Bot statistics
    flame_bot_damage: str = ""
    thunder_bot_stuns: int = 0
    golden_bot_coins_earned: str = ""

    # Misc statistics
    damage: str = ""
    coins_stolen: str = ""
    guardian_catches: int = 0
    coins_fetched: str = ""

    # Inventory
    gems: int = 0
    medals: int = 0
    reroll_shards: int = 0
    cannon_shards: int = 0
    armor_shards: int = 0
    generator_shards: int = 0
    core_shards: int = 0
    common_modules: int = 0
    rare_modules: int = 0

    # Metadata
    timestamp: str = ""
    session_id: str = ""

class TowerStatsParser:
    """Parser for Tower game statistics."""

    def __init__(self):
        self.field_mappings = {
            "Game Time": "game_time",
            "Real Time": "real_time",
            "Tier": "tier",
            "Wave": "wave",
            "Killed By": "killed_by",
            "Coins Earned": "coins_earned",
            "Cash Earned": "cash_earned",
            "Interest Earned": "interest_earned",
            "Gem Blocks Tapped": "gem_blocks_tapped",
            "Cells Earned": "cells_earned",
            "Reroll Shards Earned": "reroll_shards_earned",
            "Damage Taken": "damage_taken",
            "Damage Taken Wall": "damage_taken_wall",
            "Damage Taken While Berserked": "damage_taken_while_berserked",
            "Damage Gain From Berserk": "damage_gain_from_berserk",
            "Death Defy": "death_defy",
            "Damage Dealt": "damage_dealt",
            "Projectiles Damage": "projectiles_damage",
            "Rend Armor Damage": "rend_armor_damage",
            "Projectiles Count": "projectiles_count",
            "Lifesteal": "lifesteal",
            "Thorn Damage": "thorn_damage",
            "Orb Damage": "orb_damage",
            "Orb Hits": "orb_hits",
            "Land Mine Damage": "land_mine_damage",
            "Land Mines Spawned": "land_mines_spawned",
            "Death Ray Damage": "death_ray_damage",
            "Smart Missile Damage": "smart_missile_damage",
            "Inner Land Mine Damage": "inner_land_mine_damage",
            "Chain Lightning Damage": "chain_lightning_damage",
            "Death Wave Damage": "death_wave_damage",
            "Swamp Damage": "swamp_damage",
            "Black Hole Damage": "black_hole_damage",
            "Waves Skipped": "waves_skipped",
            "Recovery Packages": "recovery_packages",
            "Free Attack Upgrade": "free_attack_upgrade",
            "Free Defense Upgrade": "free_defense_upgrade",
            "Free Utility Upgrade": "free_utility_upgrade",
            "HP From Death Wave": "hp_from_death_wave",
            "Coins from Death Wave": "coins_from_death_wave",
            "Cash from Golden Tower": "cash_from_golden_tower",
            "Coins from Golden Tower": "coins_from_golden_tower",
            "Coins from Blackhole": "coins_from_blackhole",
            "Coins from Spotlight": "coins_from_spotlight",
            "Coins from Orbs": "coins_from_orbs",
            "Coins from Coin Upgrade": "coins_from_coin_upgrade",
            "Coins from Coin Bonuses": "coins_from_coin_bonuses",
            "Total Enemies": "total_enemies",
            "Basic": "basic",
            "Fast": "fast",
            "Tank": "tank",
            "Ranged": "ranged",
            "Boss": "boss",
            "Protector": "protector",
            "Total Elites": "total_elites",
            "Vampires": "vampires",
            "Rays": "rays",
            "Scatters": "scatters",
            "Saboteurs": "saboteurs",
            "Commanders": "commanders",
            "Overcharges": "overcharges",
            "Destroyed by Orbs": "destroyed_by_orbs",
            "Destroyed by Thorns": "destroyed_by_thorns",
            "Destroyed by Death ray": "destroyed_by_death_ray",
            "Destroyed by Land Mine": "destroyed_by_land_mine",
            "Flame bot damage": "flame_bot_damage",
            "Thunder bot stuns": "thunder_bot_stuns",
            "Golden bot coins earned": "golden_bot_coins_earned",
            "Damage": "damage",
            "Coins Stolen": "coins_stolen",
            "Guardian catches": "guardian_catches",
            "Coins Fetched": "coins_fetched",
            "Gems": "gems",
            "Medals": "medals",
            "Reroll Shards": "reroll_shards",
            "Cannon Shards": "cannon_shards",
            "Armor Shards": "armor_shards",
            "Generator Shards": "generator_shards",
            "Core Shards": "core_shards",
            "Common Modules": "common_modules",
            "Rare Modules": "rare_modules"
        }

    def parse_stats(self, stats_text: str) -> GameStats:
        """Parse game statistics from text format."""
        stats = GameStats()
        stats.timestamp = datetime.datetime.now().isoformat()
        stats.session_id = f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"

        lines = stats_text.strip().split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Split on the first occurrence of whitespace that separates field name from value
            parts = re.split(r'\s{2,}', line, 1)  # Split on 2+ spaces
            if len(parts) != 2:
                continue

            field_name = parts[0].strip()
            field_value = parts[1].strip()

            if field_name in self.field_mappings:
                attr_name = self.field_mappings[field_name]

                # Convert to appropriate type
                if hasattr(stats, attr_name):
                    current_value = getattr(stats, attr_name)
                    if isinstance(current_value, int):
                        # Try to convert to int, removing commas and other formatting
                        clean_value = re.sub(r'[,\s]', '', field_value)
                        try:
                            setattr(stats, attr_name, int(clean_value))
                        except ValueError:
                            setattr(stats, attr_name, 0)
                    else:
                        # Keep as string for complex values like "2d 8h 12m 19s" or "110,82T"
                        setattr(stats, attr_name, field_value)

        return stats

class TowerStatsTracker:
    """Main application for tracking Tower game statistics."""

    def __init__(self, data_file: str = "tower_stats.json"):
        self.data_file = Path(data_file)
        self.parser = TowerStatsParser()
        self.sessions: List[Dict[str, Any]] = []
        self.load_data()

    def load_data(self):
        """Load existing statistics data."""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.sessions = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.sessions = []

    def save_data(self):
        """Save statistics data to file."""
        with open(self.data_file, 'w', encoding='utf-8') as f:
            json.dump(self.sessions, f, indent=2, ensure_ascii=False)

    def add_session(self, stats_text: str) -> GameStats:
        """Add a new game session from text input."""
        stats = self.parser.parse_stats(stats_text)
        self.sessions.append(asdict(stats))
        self.save_data()
        return stats

    def get_sessions(self) -> List[Dict[str, Any]]:
        """Get all recorded sessions."""
        return self.sessions.copy()

    def get_latest_session(self) -> Optional[Dict[str, Any]]:
        """Get the most recent session."""
        return self.sessions[-1] if self.sessions else None

    def display_session(self, session: Dict[str, Any]):
        """Display session statistics in a formatted way."""
        print(f"\n=== Game Session: {session.get('session_id', 'Unknown')} ===")
        print(f"Timestamp: {session.get('timestamp', 'Unknown')}")
        print(f"Game Time: {session.get('game_time', 'N/A')}")
        print(f"Real Time: {session.get('real_time', 'N/A')}")
        print(f"Tier: {session.get('tier', 0)}")
        print(f"Wave: {session.get('wave', 0)}")
        print(f"Killed By: {session.get('killed_by', 'N/A')}")
        print(f"Coins Earned: {session.get('coins_earned', 'N/A')}")
        print(f"Cash Earned: {session.get('cash_earned', 'N/A')}")
        print(f"Total Enemies: {session.get('total_enemies', 0)}")
        print(f"Damage Dealt: {session.get('damage_dealt', 'N/A')}")

    def compare_sessions(self, session1_idx: int, session2_idx: int):
        """Compare two sessions."""
        if session1_idx >= len(self.sessions) or session2_idx >= len(self.sessions):
            print("Invalid session indices")
            return

        s1 = self.sessions[session1_idx]
        s2 = self.sessions[session2_idx]

        print(f"\n=== Session Comparison ===")
        print(f"Session 1: {s1.get('session_id', 'Unknown')}")
        print(f"Session 2: {s2.get('session_id', 'Unknown')}")
        print(f"Wave Progress: {s1.get('wave', 0)} vs {s2.get('wave', 0)}")
        print(f"Total Enemies: {s1.get('total_enemies', 0)} vs {s2.get('total_enemies', 0)}")
        print(f"Coins Earned: {s1.get('coins_earned', 'N/A')} vs {s2.get('coins_earned', 'N/A')}")

def main():
    """Main application entry point."""
    tracker = TowerStatsTracker()

    print("The Tower Statistics Tracker")
    print("============================")

    while True:
        print("\nOptions:")
        print("1. Add new game session")
        print("2. View latest session")
        print("3. View all sessions")
        print("4. Compare sessions")
        print("5. Exit")

        choice = input("\nEnter your choice (1-5): ").strip()

        if choice == "1":
            print("\nPaste your game statistics (press Enter twice when done):")
            lines = []
            while True:
                line = input()
                if line == "" and lines:
                    break
                lines.append(line)

            stats_text = "\n".join(lines)
            if stats_text.strip():
                stats = tracker.add_session(stats_text)
                print(f"\nSession added successfully! ID: {stats.session_id}")
            else:
                print("No data entered.")

        elif choice == "2":
            latest = tracker.get_latest_session()
            if latest:
                tracker.display_session(latest)
            else:
                print("No sessions recorded yet.")

        elif choice == "3":
            sessions = tracker.get_sessions()
            if sessions:
                for i, session in enumerate(sessions):
                    print(f"\n{i}: {session.get('session_id', 'Unknown')} - Wave {session.get('wave', 0)}")
            else:
                print("No sessions recorded yet.")

        elif choice == "4":
            sessions = tracker.get_sessions()
            if len(sessions) < 2:
                print("Need at least 2 sessions to compare.")
            else:
                print("Available sessions:")
                for i, session in enumerate(sessions):
                    print(f"{i}: {session.get('session_id', 'Unknown')}")

                try:
                    idx1 = int(input("Enter first session index: "))
                    idx2 = int(input("Enter second session index: "))
                    tracker.compare_sessions(idx1, idx2)
                except ValueError:
                    print("Invalid input.")

        elif choice == "5":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()