#!/usr/bin/env python3
"""
Debug de kills por rodada para CS2 demos (usa demoparser2)

Uso:
  python debug_round_kills.py <demo_path> <round_number>

Saída: tabela com tick, atacante, equipe, vítima, headshot, arma e total de kills.
"""

import sys
from pathlib import Path

try:
    from demoparser2 import DemoParser
    import pandas as pd
except Exception as e:
    print(f"Erro: dependências ausentes ({e}). Instale demoparser2 e pandas.")
    sys.exit(1)


def main():
    if len(sys.argv) < 3:
        print("Uso: python debug_round_kills.py <demo_path> <round_number>")
        sys.exit(1)

    demo_path = sys.argv[1]
    round_number = int(sys.argv[2])

    if not Path(demo_path).exists():
        print(f"Erro: arquivo não encontrado: {demo_path}")
        sys.exit(1)

    print(f"📂 Demo: {demo_path}")
    print(f"🔎 Rodada alvo: {round_number}")

    parser = DemoParser(demo_path)

    # Kills
    kills_df = parser.parse_event("player_death")
    if kills_df.empty:
        print("Nenhum evento de morte encontrado.")
        sys.exit(0)

    cols = []
    for c in ["tick", "round", "attacker_name", "attacker_team", "victim_name", "hs", "weapon"]:
        if c in kills_df.columns:
            cols.append(c)
    if "round" not in kills_df.columns:
        print("Aviso: coluna 'round' não presente; filtrando por janela de tick entre fins de rodada…")
        rounds_df = parser.parse_event("round_end")
        if rounds_df.empty:
            print("Erro: sem dados de round_end para estimar janela.")
            sys.exit(1)
        # Encontrar ticks de fim: rodada anterior e atual
        prev_round = max(0, round_number - 1)
        prev_rows = rounds_df[rounds_df.get("round", pd.Series(dtype=int)) == prev_round]
        target_rows = rounds_df[rounds_df.get("round", pd.Series(dtype=int)) == round_number]
        if target_rows.empty:
            print("Erro: rodada alvo não encontrada em round_end.")
            sys.exit(1)
        end_tick = int(target_rows["tick"].max()) if "tick" in target_rows.columns else None
        start_tick = int(prev_rows["tick"].max()) if (not prev_rows.empty and "tick" in prev_rows.columns) else 0
        if end_tick is None:
            print("Erro: round_end sem coluna tick.")
            sys.exit(1)
        print(f"⏱️ Janela de análise: ({start_tick}, {end_tick}]")
        # Filtrar kills estritamente entre o fim da rodada anterior e o fim da rodada atual
        window_df = kills_df[(kills_df.get("tick", 0) > start_tick) & (kills_df.get("tick", 0) <= end_tick)]
        target_df = window_df
    else:
        target_df = kills_df[kills_df["round"] == round_number]

    if target_df.empty:
        print("Nenhum kill na rodada alvo.")
        sys.exit(0)

    # Ordenar por tick para leitura
    if "tick" in target_df.columns:
        target_df = target_df.sort_values("tick")

    # Preparar tabela
    display_cols = [c for c in ["tick", "attacker_name", "attacker_team", "victim_name", "hs", "weapon"] if c in target_df.columns]
    print("\n💀 Kills (em ordem):")
    try:
        print(target_df[display_cols].to_string(index=False))
    except Exception:
        # Fallback simples caso to_string falhe por algum motivo
        for _, row in target_df.iterrows():
            vals = [str(row.get(c, "")) for c in display_cols]
            print(" | ".join(vals))

    total = len(target_df)
    first_kill_side = None
    if "attacker_team" in target_df.columns and total > 0:
        atk_team = target_df.iloc[0]["attacker_team"]
        # demoparser2 costuma usar 3=CT, 2=T
        first_kill_side = "CT" if atk_team == 3 else ("T" if atk_team == 2 else str(atk_team))

    print(f"\n📊 Total de kills na rodada {round_number}: {total}")
    if first_kill_side:
        print(f"⚡ Primeiro kill por: {first_kill_side}")


if __name__ == "__main__":
    main()
